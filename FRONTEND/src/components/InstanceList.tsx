import { useState, useEffect } from 'react';
import { instanceService, type InstanceConfig } from '../services/instanceService';

interface InstanceListProps {
  refreshTrigger: number;
}

export default function InstanceList({ refreshTrigger }: InstanceListProps) {
  const [instances, setInstances] = useState<InstanceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await instanceService.listInstances();
      setInstances(data.instances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch instances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
  }, [refreshTrigger]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this instance? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(id);
      await instanceService.deleteInstance(id);
      setInstances(prev => prev.filter(inst => inst.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete instance');
    } finally {
      setDeleting(null);
    }
  };

  const handleRefresh = () => {
    fetchInstances();
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">Loading instances...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Database Instances</h2>
        <button
          onClick={handleRefresh}
          className="bg-gray-600 text-white py-2 px-4 rounded font-medium hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {instances.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No instances found. Create one to get started!</p>
      ) : (
        <div className="space-y-3">
          {instances.map(instance => (
            <div key={instance.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === instance.id ? null : instance.id)}>
                  <h3 className="font-bold text-lg text-gray-800">{instance.dbname}</h3>
                  <p className="text-sm text-gray-600">ID: {instance.id}</p>
                  <p className="text-sm text-gray-600">Port: {instance.nodePort}</p>
                </div>
                <button
                  onClick={() => handleDelete(instance.id)}
                  disabled={deleting === instance.id}
                  className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleting === instance.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>

              {expandedId === instance.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                  <div>
                    <label className="font-medium text-gray-700">Connection URL:</label>
                    <input
                      type="text"
                      value={instance.connectionURL}
                      readOnly
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(instance.connectionURL);
                        alert('Connection URL copied to clipboard!');
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Copy URL
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <p className="text-gray-600">{instance.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Database</label>
                      <p className="text-gray-600">{instance.dbname}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resources</label>
                    <div className="grid grid-cols-2 gap-2 mt-1 text-sm text-gray-600">
                      <p>CPU Request: {instance.resources.cpuRequest || 'N/A'}</p>
                      <p>CPU Limit: {instance.resources.cpuLimit || 'N/A'}</p>
                      <p>Memory Request: {instance.resources.memRequest || 'N/A'}</p>
                      <p>Memory Limit: {instance.resources.memLimit || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Autoscaling</label>
                    <p className="text-sm text-gray-600">
                      Min Replicas: {instance.autoscaling.minReplicas} | Max Replicas: {instance.autoscaling.maxReplicas}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
