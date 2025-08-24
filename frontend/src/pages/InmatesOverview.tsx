import React, { useState, useEffect } from 'react';
import { Search, User, FileText, MapPin, Clock, Eye } from 'lucide-react';

interface Inmate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
  currentAssignment?: {
    cell: {
      number: string;
      station: {
        name: string;
        house: {
          name: string;
        };
      };
    };
  };
  services?: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  assignmentHistory?: Array<{
    id: number;
    action: string;
    notes?: string;
    createdAt: string;
    cell: {
      number: string;
      station: {
        name: string;
        house: {
          name: string;
        };
      };
    };
    assignedByUser?: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const InmatesOverview: React.FC = () => {
  const [inmates, setInmates] = useState<Inmate[]>([]);
  const [filteredInmates, setFilteredInmates] = useState<Inmate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInmate, setSelectedInmate] = useState<Inmate | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'services' | 'assignment' | 'history'>('personal');

  // Alle Insassen laden
  useEffect(() => {
    const fetchInmates = async () => {
      try {
        const response = await fetch('/api/users?group=PS Inmates');
        if (response.ok) {
          const data = await response.json();
          setInmates(data.users);
          setFilteredInmates(data.users);
        } else {
          console.error('Fehler beim Laden der Insassen');
        }
      } catch (error) {
        console.error('Fehler beim Laden der Insassen:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInmates();
  }, []);

  // Suchfunktion
  useEffect(() => {
    const filtered = inmates.filter(inmate =>
      `${inmate.firstName} ${inmate.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inmate.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inmate.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInmates(filtered);
  }, [searchTerm, inmates]);

  // Insassen-Details laden
  const loadInmateDetails = async (inmateId: number) => {
    try {
      // Aktuelle Zuweisung laden
      const assignmentResponse = await fetch(`/api/houses/assignments/current/${inmateId}`);
      const assignmentData = assignmentResponse.ok ? await assignmentResponse.json() : null;

      // Anträge laden
      const servicesResponse = await fetch(`/api/services?userId=${inmateId}`);
      const servicesData = servicesResponse.ok ? await servicesResponse.json() : { services: [] };

      // Zuweisungshistorie laden
      const historyResponse = await fetch(`/api/houses/assignments/history/${inmateId}`);
      const historyData = historyResponse.ok ? await historyResponse.json() : { history: [] };

      const inmate = inmates.find(i => i.id === inmateId);
      if (inmate) {
        setSelectedInmate({
          ...inmate,
          currentAssignment: assignmentData?.assignment,
          services: servicesData.services,
          assignmentHistory: historyData.history
        });
      }
    } catch (error) {
      console.error('Fehler beim Laden der Insassen-Details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'ASSIGNED': return 'bg-green-100 text-green-800';
      case 'TRANSFERRED': return 'bg-blue-100 text-blue-800';
      case 'REMOVED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Insassen-Übersicht</h1>
        <div className="text-sm text-gray-500">
          {filteredInmates.length} von {inmates.length} Insassen
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insassen-Liste */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Insassen suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredInmates.map((inmate) => (
                <div
                  key={inmate.id}
                  onClick={() => loadInmateDetails(inmate.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedInmate?.id === inmate.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {inmate.firstName} {inmate.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{inmate.username}
                      </div>
                      {inmate.currentAssignment && (
                        <div className="text-xs text-gray-400 mt-1">
                          <MapPin className="inline h-3 w-3 mr-1" />
                          {inmate.currentAssignment.cell.number} - {inmate.currentAssignment.cell.station.house.name}
                        </div>
                      )}
                    </div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail-Ansicht */}
        <div className="lg:col-span-2">
          {selectedInmate ? (
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedInmate.firstName} {selectedInmate.lastName}
                    </h2>
                    <p className="text-gray-500">@{selectedInmate.username}</p>
                  </div>
                  {selectedInmate.currentAssignment && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Aktuelle Zelle</div>
                      <div className="font-medium">
                        {selectedInmate.currentAssignment.cell.number}
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedInmate.currentAssignment.cell.station.house.name} - {selectedInmate.currentAssignment.cell.station.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'personal'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    Persönliche Daten
                  </button>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'services'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FileText className="h-4 w-4 inline mr-2" />
                    Anträge ({selectedInmate.services?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('assignment')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'assignment'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Aktuelle Zuweisung
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Clock className="h-4 w-4 inline mr-2" />
                    Zuweisungshistorie ({selectedInmate.assignmentHistory?.length || 0})
                  </button>
                </nav>
              </div>

              {/* Tab-Inhalte */}
              <div className="p-6">
                {activeTab === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vorname</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedInmate.firstName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nachname</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedInmate.lastName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Benutzername</label>
                        <p className="mt-1 text-sm text-gray-900">@{selectedInmate.username}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedInmate.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Registriert am</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedInmate.createdAt).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {selectedInmate.services && selectedInmate.services.length > 0 ? (
                      selectedInmate.services.map((service) => (
                        <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">{service.title}</h3>
                              <p className="text-sm text-gray-500">
                                Erstellt: {new Date(service.createdAt).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                                {service.status}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                {service.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-8">Keine Anträge vorhanden</p>
                    )}
                  </div>
                )}

                {activeTab === 'assignment' && (
                  <div className="space-y-4">
                    {selectedInmate.currentAssignment ? (
                      <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-4">Aktuelle Zuweisung</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Zelle</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedInmate.currentAssignment.cell.number}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Station</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedInmate.currentAssignment.cell.station.name}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Haus</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedInmate.currentAssignment.cell.station.house.name}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Keine aktuelle Zuweisung</p>
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    {selectedInmate.assignmentHistory && selectedInmate.assignmentHistory.length > 0 ? (
                      <div className="space-y-3">
                        {selectedInmate.assignmentHistory.map((entry) => (
                          <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(entry.action)}`}>
                                {entry.action}
                              </span>
                                                             <span className="text-sm text-gray-500">
                                 {new Date(entry.createdAt).toLocaleDateString('de-DE')} {new Date(entry.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            </div>
                            <div className="text-sm text-gray-900">
                              <strong>Zelle:</strong> {entry.cell.number} - {entry.cell.station.house.name} ({entry.cell.station.name})
                            </div>
                            {entry.notes && (
                              <div className="text-sm text-gray-600 mt-1">
                                <strong>Notiz:</strong> {entry.notes}
                              </div>
                            )}
                            {entry.assignedByUser && (
                              <div className="text-sm text-gray-500 mt-1">
                                Durch: {entry.assignedByUser.firstName} {entry.assignedByUser.lastName}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">Keine Zuweisungshistorie vorhanden</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Insasse auswählen</h3>
              <p className="text-gray-500">Wähle einen Insassen aus der Liste aus, um die Details anzuzeigen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InmatesOverview;
