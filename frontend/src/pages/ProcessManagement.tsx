import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, X, GripVertical, Users, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Group {
  id: number;
  name: string;
  description: string;
  category: string;
}

interface ProcessStep {
  id: number;
  title: string;
  description?: string;
  statusName: string;
  orderIndex: number;
  isDecision: boolean;
  isActive: boolean;
  assignments: {
    id: number;
    group: {
      id: number;
      name: string;
      description: string;
    };
  }[];
}

interface ProcessDefinition {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  steps: ProcessStep[];
}

interface ProcessManagementProps {}

const ProcessManagement: React.FC<ProcessManagementProps> = () => {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState<ProcessDefinition[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Modal States
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStep, setEditingStep] = useState<ProcessStep | null>(null);

  // Form States
  const [processForm, setProcessForm] = useState({
    name: '',
    description: ''
  });

  const [stepForm, setStepForm] = useState({
    title: '',
    statusName: '',
    description: '',
    isDecision: false,
    orderIndex: 0,
    groupIds: [] as number[]
  });

  useEffect(() => {
    fetchProcesses();
    fetchGroups();
  }, []);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/processes');
      setProcesses(response.data.processes);
    } catch (error: any) {
      console.error('Error fetching processes:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Prozesse' });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get('/processes/groups');
      setGroups(response.data.groups);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
    }
  };

  const handleProcessSelect = (processName: string) => {
    const process = processes.find(p => p.name === processName);
    setSelectedProcess(process || null);
  };

  const handleCreateProcess = async () => {
    try {
      const response = await api.post('/processes', processForm);
      setMessage({ type: 'success', text: 'Prozess erfolgreich erstellt' });
      setShowProcessModal(false);
      setProcessForm({ name: '', description: '' });
      fetchProcesses();
    } catch (error: any) {
      console.error('Error creating process:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler beim Erstellen des Prozesses' });
    }
  };

  const handleCreateStep = async () => {
    if (!selectedProcess) return;

    try {
      const response = await api.post(`/processes/${selectedProcess.id}/steps`, {
        ...stepForm,
        orderIndex: selectedProcess.steps.length
      });
      setMessage({ type: 'success', text: 'Prozessschritt erfolgreich erstellt' });
      setShowStepModal(false);
      resetStepForm();
      fetchProcesses();
    } catch (error: any) {
      console.error('Error creating step:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler beim Erstellen des Schritts' });
    }
  };

  const handleUpdateStep = async () => {
    if (!editingStep) return;

    try {
      const response = await api.put(`/processes/steps/${editingStep.id}`, stepForm);
      setMessage({ type: 'success', text: 'Prozessschritt erfolgreich aktualisiert' });
      setShowStepModal(false);
      setEditingStep(null);
      resetStepForm();
      fetchProcesses();
    } catch (error: any) {
      console.error('Error updating step:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler beim Aktualisieren des Schritts' });
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('Möchten Sie diesen Schritt wirklich löschen?')) return;

    try {
      await api.delete(`/processes/steps/${stepId}`);
      setMessage({ type: 'success', text: 'Prozessschritt erfolgreich gelöscht' });
      fetchProcesses();
    } catch (error: any) {
      console.error('Error deleting step:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fehler beim Löschen des Schritts' });
    }
  };

  const handleEditStep = (step: ProcessStep) => {
    setEditingStep(step);
    setStepForm({
      title: step.title,
      statusName: step.statusName,
      description: step.description || '',
      isDecision: step.isDecision,
      orderIndex: step.orderIndex,
      groupIds: step.assignments.map(a => a.group.id)
    });
    setShowStepModal(true);
  };

  const resetStepForm = () => {
    setStepForm({
      title: '',
      statusName: '',
      description: '',
      isDecision: false,
      orderIndex: 0,
      groupIds: []
    });
  };

  const openStepModal = () => {
    setEditingStep(null);
    resetStepForm();
    setShowStepModal(true);
  };

  const closeStepModal = () => {
    setShowStepModal(false);
    setEditingStep(null);
    resetStepForm();
  };

  const getStatusColor = (statusName: string) => {
    const colors: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'SECURITY_REVIEW': 'bg-orange-100 text-orange-800',
      'MEDICAL_REVIEW': 'bg-purple-100 text-purple-800',
      'PAYMENT_APPROVAL': 'bg-indigo-100 text-indigo-800'
    };
    return colors[statusName] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verwaltung Antragsprozesse</h1>
          <p className="text-gray-600">Definieren Sie Workflow-Prozesse für verschiedene Antragstypen</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
            <button
              onClick={() => setMessage(null)}
              className="ml-2 text-sm underline"
            >
              Schließen
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Prozessauswahl */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Antragstypen</h2>
                <button
                  onClick={() => setShowProcessModal(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="Neuen Antragstyp erstellen"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {processes.map((process) => (
                  <button
                    key={process.id}
                    onClick={() => handleProcessSelect(process.name)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedProcess?.id === process.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{process.name}</div>
                    {process.description && (
                      <div className="text-sm text-gray-500 mt-1">{process.description}</div>
                    )}
                  </button>
                ))}
              </div>

              {processes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Keine Antragstypen definiert</p>
                  <button
                    onClick={() => setShowProcessModal(true)}
                    className="mt-2 text-blue-600 hover:underline"
                  >
                    Ersten Antragstyp erstellen
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content - Prozessschritte */}
          <div className="lg:col-span-3">
            {selectedProcess ? (
              <div className="bg-white rounded-lg shadow">
                {/* Prozess Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedProcess.name}</h2>
                      {selectedProcess.description && (
                        <p className="text-gray-600 mt-1">{selectedProcess.description}</p>
                      )}
                    </div>
                    <button
                      onClick={openStepModal}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} className="mr-2" />
                      Schritt hinzufügen
                    </button>
                  </div>
                </div>

                {/* Prozessschritte */}
                <div className="p-6">
                  {selectedProcess.steps.length > 0 ? (
                    <div className="space-y-4">
                      {selectedProcess.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium text-gray-600 mt-1">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(step.statusName)}`}>
                                    {step.statusName}
                                  </span>
                                  {step.isDecision ? (
                                    <span className="flex items-center text-orange-600 text-sm">
                                      <CheckCircle size={14} className="mr-1" />
                                      Entscheidung
                                    </span>
                                  ) : (
                                    <span className="flex items-center text-blue-600 text-sm">
                                      <AlertCircle size={14} className="mr-1" />
                                      Bearbeitung
                                    </span>
                                  )}
                                </div>
                                
                                {step.description && (
                                  <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                                )}

                                {/* Zugewiesene Gruppen */}
                                {step.assignments.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <Users size={14} className="text-gray-400" />
                                    <div className="flex flex-wrap gap-1">
                                      {step.assignments.map((assignment) => (
                                        <span
                                          key={assignment.id}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                        >
                                          {assignment.group.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditStep(step)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Schritt bearbeiten"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteStep(step.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Schritt löschen"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <AlertCircle size={48} className="mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Prozessschritte definiert</h3>
                      <p className="text-gray-600 mb-4">
                        Erstellen Sie den ersten Schritt für diesen Antragstyp
                      </p>
                      <button
                        onClick={openStepModal}
                        className="flex items-center mx-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={16} className="mr-2" />
                        Ersten Schritt erstellen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <AlertCircle size={64} className="mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Antragstyp auswählen</h3>
                <p className="text-gray-600">
                  Wählen Sie einen Antragstyp aus der linken Seitenleiste aus, um dessen Prozessschritte zu verwalten
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prozess Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Neuen Antragstyp erstellen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={processForm.name}
                  onChange={(e) => setProcessForm({ ...processForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. Besuch, Taschengeld-Antrag"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={processForm.description}
                  onChange={(e) => setProcessForm({ ...processForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optionale Beschreibung des Antragstyps"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowProcessModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateProcess}
                disabled={!processForm.name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schritt Modal */}
      {showStepModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingStep ? 'Prozessschritt bearbeiten' : 'Neuen Prozessschritt erstellen'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel *
                </label>
                <input
                  type="text"
                  value={stepForm.title}
                  onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. Sicherheitsprüfung, Zahlungsfreigabe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status-Name *
                </label>
                <input
                  type="text"
                  value={stepForm.statusName}
                  onChange={(e) => setStepForm({ ...stepForm, statusName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. SECURITY_REVIEW, PAYMENT_APPROVAL"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={stepForm.description}
                  onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Optionale Beschreibung des Schritts"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={stepForm.isDecision}
                    onChange={(e) => setStepForm({ ...stepForm, isDecision: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Entscheidungsschritt (nicht nur Bearbeitung)
                  </span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zuständige Gruppen *
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {groups.map((group) => (
                    <label key={group.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={stepForm.groupIds.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStepForm({
                              ...stepForm,
                              groupIds: [...stepForm.groupIds, group.id]
                            });
                          } else {
                            setStepForm({
                              ...stepForm,
                              groupIds: stepForm.groupIds.filter(id => id !== group.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{group.name}</span>
                      <span className="text-xs text-gray-500">({group.description})</span>
                    </label>
                  ))}
                </div>
                {stepForm.groupIds.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">Mindestens eine Gruppe muss ausgewählt werden</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeStepModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={editingStep ? handleUpdateStep : handleCreateStep}
                disabled={!stepForm.title.trim() || !stepForm.statusName.trim() || stepForm.groupIds.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editingStep ? 'Aktualisieren' : 'Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessManagement;

