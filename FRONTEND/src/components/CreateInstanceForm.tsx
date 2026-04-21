import { useState } from 'react';
import { instanceService, type CreateInstancePayload } from '../services/instanceService';

interface CreateInstanceFormProps {
  onSuccess: () => void;
}

export default function CreateInstanceForm({ onSuccess }: CreateInstanceFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    dbname: '',
    cpuRequest: '100m',
    cpuLimit: '500m',
    memRequest: '128Mi',
    memLimit: '512Mi',
    minReplicas: '1',
    maxReplicas: '3',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload: CreateInstancePayload = {
        username: formData.username,
        password: formData.password,
        dbname: formData.dbname,
        cpuRequest: formData.cpuRequest,
        cpuLimit: formData.cpuLimit,
        memRequest: formData.memRequest,
        memLimit: formData.memLimit,
        minReplicas: parseInt(formData.minReplicas),
        maxReplicas: parseInt(formData.maxReplicas),
      };

      const result = await instanceService.createInstance(payload);
      setSuccess(`Instance created! Connection URL: ${result.connectionURL}`);
      setFormData({
        username: '',
        password: '',
        dbname: '',
        cpuRequest: '100m',
        cpuLimit: '500m',
        memRequest: '128Mi',
        memLimit: '512Mi',
        minReplicas: '1',
        maxReplicas: '3',
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Database Instance</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="postgres"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="secure_password"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Database Name *</label>
          <input
            type="text"
            name="dbname"
            value={formData.dbname}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="mydb"
          />
        </div>

        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          {advancedOpen ? '▼' : '▶'} Advanced Settings
        </button>

        {advancedOpen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">CPU Request</label>
              <input
                type="text"
                name="cpuRequest"
                value={formData.cpuRequest}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="100m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CPU Limit</label>
              <input
                type="text"
                name="cpuLimit"
                value={formData.cpuLimit}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="500m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Memory Request</label>
              <input
                type="text"
                name="memRequest"
                value={formData.memRequest}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="128Mi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Memory Limit</label>
              <input
                type="text"
                name="memLimit"
                value={formData.memLimit}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                placeholder="512Mi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Replicas</label>
              <input
                type="number"
                name="minReplicas"
                value={formData.minReplicas}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Replicas</label>
              <input
                type="number"
                name="maxReplicas"
                value={formData.maxReplicas}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                min="1"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Instance'}
        </button>
      </form>
    </div>
  );
}
