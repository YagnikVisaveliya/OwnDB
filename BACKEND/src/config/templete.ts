import * as k8s from '@kubernetes/client-node';

export interface InstanceConfig {
    id: string;
    dbname: string;
    username: string;
    password: string;   
    cpuRequest: string;
    cpuLimit: string;
    memRequest: string;
    memLimit: string;
    minReplicas: number;
    maxReplicas: number;
    nodePort?: number;
}

export const namespace = (cfg: InstanceConfig) : k8s.V1Namespace => {
    return {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
            name: `db-${cfg.id}`,
        },
    };
};

export const secret = (cfg: InstanceConfig) : k8s.V1Secret => {
    return {
        apiVersion: 'v1',
        kind: 'Secret',
        metadata: {
            name: `pg-secret`,
            namespace: `db-${cfg.id}`,
        },
        stringData: {
            POSTGRES_DB: cfg.dbname,
            POSTGRES_USER: cfg.username,
            POSTGRES_PASSWORD: cfg.password,
        },
    };
};

export const pvc = (cfg: InstanceConfig) : k8s.V1PersistentVolumeClaim => {
    return {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
            name: "pg-pvc",
            namespace: `db-${cfg.id}`,
        },
        spec: {
            accessModes: ['ReadWriteOnce'],
            resources: {
                requests: {
                    storage: '1Gi',
                },
            }
        }
    }
}

export const deployment = (cfg: InstanceConfig) : k8s.V1Deployment => {
    return {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
            name: 'postgres',
            namespace: `db-${cfg.id}`,
        },
        spec: {
            replicas: cfg.minReplicas,
            selector: {
                matchLabels: {
                    app: 'postgres',
                }
            },
            template: {
                metadata: {
                    labels: {
                        app: 'postgres',
                    }
                },
                spec: {
                    containers: [
                        {
                            name: 'postgres',
                            image: 'postgres:16-alpine',
                            ports: [{
                                containerPort: 5432,
                            }],
                            env: [{
                                name: "PGDATA",
                                value: "/var/lib/postgresql/data/pgdata",
                            }],
                            envFrom: [{secretRef: {
                                name: "pg-secret",
                            }}],
                            resources: {
                                requests: {
                                    cpu: cfg.cpuRequest,
                                    memory: cfg.memRequest,
                                },
                                limits: {
                                    cpu: cfg.cpuLimit,
                                    memory: cfg.memLimit, 
                                }
                            },
                            volumeMounts: [{
                                name: 'pg-data',
                                mountPath: '/var/lib/postgresql/data',

                            }],
                            readinessProbe: {
                                exec: {
                                    command: ["pg_isready", "-U", cfg.username, "-d", cfg.dbname],
                                },
                                initialDelaySeconds: 10,
                                periodSeconds: 5, 
                            }
                        }
                    ],
                    volumes: [{
                        name: 'pg-data',
                        persistentVolumeClaim: {
                            claimName: 'pg-pvc',
                        },
                    }]
                }
            }
        }
    };
};

export const service = (cfg: InstanceConfig) : k8s.V1Service => {
    const servicePort: k8s.V1ServicePort = {
        port: 5432,
        targetPort: 5432 as unknown as k8s.IntOrString,
    };

    if (typeof cfg.nodePort === 'number') {
        servicePort.nodePort = cfg.nodePort;
    }

    return {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
            name: 'postgres-svc',
            namespace: `db-${cfg.id}`,
        },
        spec: {
            type: 'NodePort',
            selector: {
                app: 'postgres',
            },
            ports: [servicePort]
        }
    }
}

//HPA horizontal pod autoscaler
export const hpa = (cfg: InstanceConfig) : k8s.V2HorizontalPodAutoscaler => {
    return {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        metadata: {
            name: 'postgres-hpa',
            namespace: `db-${cfg.id}`,
        },
        spec: {
            scaleTargetRef: {
                apiVersion: 'apps/v1',
                kind: 'Deployment',
                name: 'postgres',
            },
            minReplicas: cfg.minReplicas,
            maxReplicas: cfg.maxReplicas,
            metrics: [{
                type: "Resource",
                resource: {
                    name: "cpu",
                    target: {
                        type: "Utilization",
                        averageUtilization: 70,
                    }
                }
            }]
        }
    };
};

