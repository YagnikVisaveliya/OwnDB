const API_BASE = import.meta.env.VITE_API_BASE;

export interface InstanceConfig {
  id: string;
  dbname: string;
  username: string;
  connectionURL: string;
  resources: {
    cpuRequest?: string;
    cpuLimit?: string;
    memRequest?: string;
    memLimit?: string;
  };
  autoscaling: {
    minReplicas: number;
    maxReplicas: number;
  };
  nodePort: number;
}

export interface CreateInstancePayload {
  username: string;
  password: string;
  dbname: string;
  cpuRequest?: string;
  cpuLimit?: string;
  memRequest?: string;
  memLimit?: string;
  minReplicas?: number;
  maxReplicas?: number;
}

export const instanceService = {
  // Create a new instance
  async createInstance(payload: CreateInstancePayload) {
    const response = await fetch(`${API_BASE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to create instance');
    return response.json();
  },

  // List all instances
  async listInstances(): Promise<{ instances: InstanceConfig[] }> {
    const response = await fetch(`${API_BASE}/all`);
    if (!response.ok) throw new Error('Failed to list instances');
    return response.json();
  },

  // Get a specific instance
  async getInstance(id: string): Promise<InstanceConfig> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Instance not found');
    return response.json();
  },

  // Delete an instance
  async deleteInstance(id: string) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete instance');
    return response.json();
  },
};
