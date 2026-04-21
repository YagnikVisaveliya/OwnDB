import { execSync } from "node:child_process";
import { secret, namespace, type InstanceConfig, pvc, deployment, service, hpa} from "../config/templete.js";
import { randomUUID } from "node:crypto";
import { appsV1Api, autoscalingV2Api, coreV1Api } from "../config/client.js";
import type { Request, Response } from "express";

const instances = new Map<string, InstanceConfig & {
    connectionURL: string;
}>();

//pick free pods in the range of 30000-32767

const usedPorts = new Set<number>();

function pickFreePort(): number {
    for (let port = 30000; port <= 32767; port++) {
        if (!usedPorts.has(port)) {
            usedPorts.add(port);
            return port;
        }
    }
    throw new Error("No free port available");

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

    const id=randomUUID().slice(0, 8);
    const nodePort = pickFreePort();

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
        nodePort,
    };

    try {
        await coreV1Api.createNamespace({
            body: namespace(cfg),           
        });

        await coreV1Api.createNamespacedSecret({
            namespace: `db-${id}`,
        body: secret(cfg),
        });

        await coreV1Api.createNamespacedPersistentVolumeClaim({
            namespace: `db-${id}`,
            body: pvc(cfg),
        });

        await appsV1Api.createNamespacedDeployment({
            namespace: `db-${id}`,
            body: deployment(cfg),
        });

        await coreV1Api.createNamespacedService({
            namespace: `db-${id}`,
            body: service(cfg),
        });

        await autoscalingV2Api.createNamespacedHorizontalPodAutoscaler({
            namespace: `db-${id}`,
            body: hpa(cfg),
        });

        const miniKubeIp = getMiniKubeIp();
        const connectionURL = `postgresql://${username}:${password}@${miniKubeIp}:${nodePort}/${dbname}`;

        instances.set(id, {
            ...cfg,
            connectionURL,
        }); 

        return res.status(201).json({
            id,
            connectionURL,
            namespace: `db-${id}`,
            nodePort,
            message: "Instance provisioning started. It may take a few moments for the instance to be ready.",
        });

    } catch (error) {
        console.error("Error creating instance:", error);
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
        usedPorts.delete(inst.nodePort);
        instances.delete(id);
        return res.status(200).json({ message: "Instance deleted" });
    } catch (error) {
        console.error("Error deleting instance:", error);
        return res.status(500).json({ error: "Failed to delete instance" });
    }
};
