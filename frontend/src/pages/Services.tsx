import { useState, useEffect } from 'react'
import { getServices } from '../services/api'
import { Plus, Search, Filter } from 'lucide-react'

const Services = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getServices()
        setServices(data.services || [])
      } catch (error) {
        console.error('Fehler beim Laden der Services:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Anträge</h1>
        <button className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Neuer Service
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Anträge durchsuchen..."
                className="input pl-10"
              />
            </div>
            <button className="btn btn-secondary flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        <div className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Keine Anträge gefunden.</p>
              <p className="text-sm text-gray-400 mt-2">
                                  Erstellen Sie Ihren ersten Antrag.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service: any) => (
                <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.description || 'Keine Beschreibung'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        service.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                        service.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                        service.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {service.priority}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Erstellt von {service.createdByUser?.firstName} {service.createdByUser?.lastName} am{' '}
                    {new Date(service.createdAt).toLocaleDateString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Services
