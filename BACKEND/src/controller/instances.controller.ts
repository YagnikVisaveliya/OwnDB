import { execSync } from "node:child_process";
import { secret, namespace, type InstanceConfig, pvc, deployment, service, hpa} from "../config/templete.js";
import { randomUUID } from "node:crypto";
import { appsV1Api, autoscalingV2Api, coreV1Api } from "../config/client.js";
import type { Request, Response } from "express";

type StoredInstance = Omit<InstanceConfig, "nodePort"> & {
    nodePort: number;
    connectionURL: string;
};

const instances = new Map<string, StoredInstance>();

function readAssignedNodePort(serviceResponse: unknown): number | undefined {
    const direct = serviceResponse as { spec?: { ports?: Array<{ nodePort?: number }> } };
    const wrapped = serviceResponse as { body?: { spec?: { ports?: Array<{ nodePort?: number }> } } };

    return direct.spec?.ports?.[0]?.nodePort ?? wrapped.body?.spec?.ports?.[0]?.nodePort;
}

// Keep compatibility with local minikube, but allow explicit host override for EC2/public deployments.
function getDatabaseHost(): string {
    const fromEnv = process.env.DB_NODE_HOST?.trim();
    if (fromEnv) {
        return fromEnv;
    }

    return getMiniKubeIp();
}

function getMiniKubeIp(): string {
    try {
        return execSync('minikube ip', {
            encoding: 'utf-8',
        }).trim();
    } catch (error) {
        return "127.0.0.1";
    }
}

export const createInstance = async (req: Request, res: Response) => {
    const body = req.body;

    const {
        username,
        password,
        dbname,
        cpuRequest,
        cpuLimit,
        memRequest,
        memLimit,
        minReplicas,
        maxReplicas,
    } = body;

    if (!username || !password || !dbname) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    if (Number(minReplicas) > Number(maxReplicas)) {
        return res.status(400).json({ error: "minReplicas cannot be greater than maxReplicas" });
    }

    const id = randomUUID().slice(0, 8);
    const namespaceName = `db-${id}`;
    let namespaceCreated = false;

    const cfg: InstanceConfig = {
        id,
        username,
        password,
        dbname,
        cpuRequest,
        cpuLimit,
        memRequest,
        memLimit,
        minReplicas: Number(minReplicas),
        maxReplicas: Number(maxReplicas),
    };

    try {
        await coreV1Api.createNamespace({
            body: namespace(cfg),           
        });
        namespaceCreated = true;

        await coreV1Api.createNamespacedSecret({
            namespace: namespaceName,
        body: secret(cfg),
        });

        await coreV1Api.createNamespacedPersistentVolumeClaim({
            namespace: namespaceName,
            body: pvc(cfg),
        });

        await appsV1Api.createNamespacedDeployment({
            namespace: namespaceName,
            body: deployment(cfg),
        });

        const createdService = await coreV1Api.createNamespacedService({
            namespace: namespaceName,
            body: service(cfg),
        });

        const assignedNodePort = readAssignedNodePort(createdService);
        if (typeof assignedNodePort !== "number") {
            throw new Error("Kubernetes did not return an assigned NodePort");
        }

        await autoscalingV2Api.createNamespacedHorizontalPodAutoscaler({
            namespace: namespaceName,
            body: hpa(cfg),
        });

        const databaseHost = getDatabaseHost();
        const connectionURL = `postgresql://${username}:${password}@${databaseHost}:${assignedNodePort}/${dbname}`;

        instances.set(id, {
            ...cfg,
            nodePort: assignedNodePort,
            connectionURL,
        }); 

        return res.status(201).json({
            id,
            connectionURL,
            namespace: namespaceName,
            nodePort: assignedNodePort,
            message: "Instance provisioning started. It may take a few moments for the instance to be ready.",
        });

    } catch (error) {
        console.error("Error creating instance:", error);

        if (namespaceCreated) {
            try {
                await coreV1Api.deleteNamespace({ name: namespaceName });
                console.log("Rolled back namespace after provisioning error:", namespaceName);
            } catch (cleanupError) {
                console.error("Failed to rollback namespace after provisioning error:", cleanupError);
            }
        }

        return res.status(500).json({ error: "Failed to create instance" });
    }

};

export const listInstances = (_req: Request, res: Response) => {
    const list = Array.from(instances.values()).map(({ id, dbname, username, connectionURL, cpuRequest, cpuLimit, memRequest, memLimit, minReplicas, maxReplicas, nodePort }) => ({
        id,
        dbname,
        username,
        connectionURL,
        resources: { cpuRequest, cpuLimit, memRequest, memLimit },
        autoscaling: { minReplicas, maxReplicas },
        nodePort,
    }));
    return res.status(200).json({ instances: list });
};

export const getInstance = (req: Request, res: Response) => {
    const id = req.params.id;
    if (typeof id !== "string") {
        return res.status(400).json({ error: "Invalid instance id" });
    }
    const inst = instances.get(id);
    if (!inst) {
        return res.status(404).json({ error: "Instance not found" });
    }
    return res.status(200).json({
        id: inst.id,
        dbname: inst.dbname,
        username: inst.username,
        connectionURL: inst.connectionURL,
        resources: { cpuRequest: inst.cpuRequest, cpuLimit: inst.cpuLimit, memRequest: inst.memRequest, memLimit: inst.memLimit },
        autoscaling: { minReplicas: inst.minReplicas, maxReplicas: inst.maxReplicas },
        nodePort: inst.nodePort,
    });
};

export const deleteInstance = async (req: Request, res: Response) => {
    const id = req.params.id;
    if (typeof id !== "string") {
        return res.status(400).json({ error: "Invalid instance id" });
    }
    const inst = instances.get(id);
    if (!inst) {
        return res.status(404).json({ error: "Instance not found" });
    }
    try {
        await coreV1Api.deleteNamespace({ name: `db-${id}` });
        instances.delete(id);
        return res.status(200).json({ message: "Instance deleted" });
    } catch (error) {
        console.error("Error deleting instance:", error);
        return res.status(500).json({ error: "Failed to delete instance" });
    }
};
