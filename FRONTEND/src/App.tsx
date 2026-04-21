
import { useState } from 'react'
import CreateInstanceForm from './components/CreateInstanceForm'
import InstanceList from './components/InstanceList'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleInstanceCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">OwnDB</h1>
          <p className="text-gray-600">Kubernetes-Managed Database Instance Manager</p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1">
            <CreateInstanceForm onSuccess={handleInstanceCreated} />
          </div>

          {/* Instances Column */}
          <div className="lg:col-span-2">
            <InstanceList refreshTrigger={refreshTrigger} />
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md border border-gray-200 text-center text-sm text-gray-600">
          <p>
            All database instances are provisioned on Kubernetes with automatic scaling,
            resource management, and persistent storage.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
