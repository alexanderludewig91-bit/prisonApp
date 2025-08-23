import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Building, Users, MapPin, Home, Plus, X, User, ArrowRight } from 'lucide-react';
import CellAssignmentModal from '../components/CellAssignmentModal';
import RemoveAssignmentModal from '../components/RemoveAssignmentModal';
import SearchFilters from '../components/SearchFilters';
import TransferModal from '../components/TransferModal';
import CellCard from '../components/CellCard';
import DraggableInmate from '../components/DraggableInmate';
import DropZone from '../components/DropZone';

interface House {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  stations: Station[];
  _count: {
    stations: number;
  };
}

interface Cell {
  id: number;
  number: string;
  capacity: number;
  description: string;
  assignments: {
    id: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
    };
  }[];
}

interface Station {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  cells: Cell[];
  _count: {
    cells: number;
  };
}

const HouseManagement: React.FC = () => {
  const { user } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal States
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [selectedStation, setSelectedStation] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState('all');

  // Prüfe Admin-Berechtigung
  const userGroups = user?.groups?.map(g => g.name) || [];
  const isAdmin = userGroups.some(group => group === 'PS Designers');

  useEffect(() => {
    if (!isAdmin) {
      setError('Keine Berechtigung für Hausverwaltung');
      setLoading(false);
      return;
    }

    fetchHouses();
  }, [isAdmin]);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/houses');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Häuser');
      }

      const data = await response.json();
      setHouses(data.houses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  // Zellen-Zuweisung erstellen
  const handleAssignInmate = async (userId: number, notes: string) => {
    if (!selectedCell) {
      console.error('Keine Zelle ausgewählt für Zuweisung');
      return;
    }

    try {
      console.log('Zuweisung versuchen:', {
        cellId: selectedCell.id,
        cellNumber: selectedCell.number,
        userId,
        notes
      });

      const response = await fetch(`/api/houses/cells/${selectedCell.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, notes }),
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Fehler:', errorData);
        throw new Error(errorData.error || errorData.details || 'Fehler beim Zuweisen');
      }

      const result = await response.json();
      console.log('Zuweisung erfolgreich:', result);

      // Daten neu laden
      await fetchHouses();
    } catch (err) {
      console.error('Zuweisung Fehler:', err);
      throw err;
    }
  };

  // Zellen-Zuweisung entfernen
  const handleRemoveAssignment = async (assignmentId: number) => {
    try {
      console.log('Entfernung versuchen:', { assignmentId });

      const response = await fetch(`/api/houses/assignments/${assignmentId}`, {
        method: 'DELETE',
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Fehler:', errorData);
        throw new Error(errorData.error || errorData.details || 'Fehler beim Entfernen');
      }

      const result = await response.json();
      console.log('Entfernung erfolgreich:', result);

      // Daten neu laden
      await fetchHouses();
    } catch (err) {
      console.error('Entfernung Fehler:', err);
      throw err;
    }
  };

  // Modal öffnen für Zuweisung
  const openAssignmentModal = (cell: Cell) => {
    setSelectedCell(cell);
    setAssignmentModalOpen(true);
  };

  // Modal öffnen für Entfernung
  const openRemoveModal = (assignment: any, cellNumber: string) => {
    setSelectedAssignment(assignment);
    setRemoveModalOpen(true);
  };

  // Modal öffnen für Verlegung
  const openTransferModal = (assignment: any, cell: Cell) => {
    setSelectedAssignment(assignment);
    setSelectedCell(cell);
    setTransferModalOpen(true);
  };

  // Verlegung durchführen
  const handleTransfer = async (assignmentId: number, targetCellId: number, notes: string) => {
    try {
      console.log('HandleTransfer called:', { assignmentId, targetCellId, notes });
      
      // Finde die aktuelle Zuweisung und den Benutzer
      let currentAssignment = null;
      let targetCell = null;
      
      // Durch alle Häuser und Zellen suchen
      for (const house of houses) {
        for (const station of house.stations) {
          for (const cell of station.cells) {
            // Finde die aktuelle Zuweisung
            const assignment = cell.assignments.find(a => a.id === assignmentId);
            if (assignment) {
              currentAssignment = assignment;
            }
            
            // Finde die Ziel-Zelle
            if (cell.id === targetCellId) {
              targetCell = cell;
            }
          }
        }
      }
      
      if (!currentAssignment) {
        throw new Error('Zuweisung nicht gefunden');
      }
      
      if (!targetCell) {
        throw new Error('Ziel-Zelle nicht gefunden');
      }
      
      console.log('Found assignment:', currentAssignment);
      console.log('Target cell:', targetCell);
      
      // Speichere die Benutzer-ID vor dem Entfernen
      const userId = currentAssignment.user.id;
      
      // Erst aus aktueller Zelle entfernen
      await handleRemoveAssignment(assignmentId);
      
      // Kurz warten, damit die DB-Operation abgeschlossen ist
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Direkt die neue Zuweisung erstellen, ohne selectedCell zu verwenden
      console.log('Creating new assignment for user:', userId, 'in cell:', targetCell.id);
      
      const response = await fetch(`/api/houses/cells/${targetCell.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, notes }),
      });

      console.log('Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Fehler:', errorData);
        throw new Error(errorData.error || errorData.details || 'Fehler beim Zuweisen');
      }

      const result = await response.json();
      console.log('Zuweisung erfolgreich:', result);
      
      // Daten neu laden
      await fetchHouses();
    } catch (err) {
      console.error('Verlegung Fehler:', err);
      throw err;
    }
  };

  // Drag & Drop Handler
  const handleDragStart = (e: React.DragEvent, assignmentId: number, inmate: any) => {
    e.dataTransfer.setData('assignmentId', assignmentId.toString());
    e.dataTransfer.setData('inmateData', JSON.stringify(inmate));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (cellId: number, assignmentId: number) => {
    try {
      console.log('HandleDrop called:', { cellId, assignmentId });
      
      // Prüfen, ob die Zelle existiert und Platz hat
      let targetCell = null;
      for (const house of houses) {
        for (const station of house.stations) {
          for (const cell of station.cells) {
            if (cell.id === cellId) {
              targetCell = cell;
              break;
            }
          }
          if (targetCell) break;
        }
        if (targetCell) break;
      }
      
      if (!targetCell) {
        console.error('Ziel-Zelle nicht gefunden:', cellId);
        return;
      }
      
      if (targetCell.assignments.length >= targetCell.capacity) {
        console.error('Ziel-Zelle ist voll:', targetCell);
        return;
      }
      
      console.log('Target cell found:', targetCell);
      
      // Verlegung durchführen
      await handleTransfer(assignmentId, cellId, 'Drag & Drop Verlegung');
    } catch (err) {
      console.error('Drop Fehler:', err);
    }
  };

  // Filter zurücksetzen
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedHouse('');
    setSelectedStation('');
    setOccupancyFilter('all');
  };

  // Gefilterte Daten
  const filteredHouses = useMemo(() => {
    return houses.filter(house => {
      // Haus-Filter
      if (selectedHouse && house.id.toString() !== selectedHouse) {
        return false;
      }

      // Station-Filter
      if (selectedStation) {
        const hasMatchingStation = house.stations.some(station => 
          station.id.toString() === selectedStation
        );
        if (!hasMatchingStation) {
          return false;
        }
      }

      // Such-Filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hasMatchingContent = house.stations.some(station =>
          station.cells.some(cell => {
            // Zellen-Nummer oder Beschreibung
            if (cell.number.toLowerCase().includes(searchLower) ||
                cell.description.toLowerCase().includes(searchLower)) {
              return true;
            }
            // Insassen-Namen
            if (cell.assignments.some(assignment =>
              assignment.user.firstName.toLowerCase().includes(searchLower) ||
              assignment.user.lastName.toLowerCase().includes(searchLower) ||
              assignment.user.username.toLowerCase().includes(searchLower)
            )) {
              return true;
            }
            return false;
          })
        );
        if (!hasMatchingContent) {
          return false;
        }
      }

      return true;
    });
  }, [houses, selectedHouse, selectedStation, searchTerm]);

  // Alle Stationen für Filter
  const allStations = useMemo(() => {
    const stations: Array<{ id: number; name: string; houseId: number }> = [];
    houses.forEach(house => {
      house.stations.forEach(station => {
        stations.push({
          id: station.id,
          name: station.name,
          houseId: house.id
        });
      });
    });
    return stations;
  }, [houses]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">
            Keine Berechtigung
          </div>
          <p className="text-gray-600">
            Sie haben keine Berechtigung für die Hausverwaltung.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">
            Fehler beim Laden
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHouses}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Building className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Hausverwaltung</h1>
        </div>
        <p className="text-gray-600">
          Verwaltung der Häuser, Stationen und Zellen
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Home className="h-4 w-4 inline mr-2" />
            Übersicht
          </button>
          <button
            onClick={() => setActiveTab('houses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'houses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Häuser
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Zuweisungen
          </button>
        </nav>
      </div>

       {/* Search Filters - nur für Häuser und Zuweisungen Tabs */}
       {(activeTab === 'houses' || activeTab === 'assignments') && (
         <SearchFilters
           searchTerm={searchTerm}
           onSearchChange={setSearchTerm}
           selectedHouse={selectedHouse}
           onHouseChange={setSelectedHouse}
           selectedStation={selectedStation}
           onStationChange={setSelectedStation}
           occupancyFilter={occupancyFilter}
           onOccupancyFilterChange={setOccupancyFilter}
           houses={houses.map(h => ({ id: h.id, name: h.name }))}
           stations={allStations}
           onClearFilters={clearFilters}
         />
       )}

       {/* Tab Content */}
       <div className="space-y-6">
         {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Haus-Übersicht</h2>
            
                         {/* Statistiken */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
               <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex items-center">
                   <Building className="h-8 w-8 text-blue-600" />
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Häuser</p>
                     <p className="text-2xl font-semibold text-gray-900">{houses.length}</p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex items-center">
                   <MapPin className="h-8 w-8 text-green-600" />
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Stationen</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       {houses.reduce((total, house) => total + house._count.stations, 0)}
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-white p-6 rounded-lg shadow">
                 <div className="flex items-center">
                   <Users className="h-8 w-8 text-purple-600" />
                   <div className="ml-4">
                     <p className="text-sm font-medium text-gray-600">Zellen</p>
                     <p className="text-2xl font-semibold text-gray-900">
                       {houses.reduce((total, house) => 
                         total + house.stations.reduce((stationTotal, station) => 
                           stationTotal + station._count.cells, 0), 0
                       )}
                     </p>
                   </div>
                 </div>
               </div>
               
                               <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Belegung</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {(() => {
                          const totalCapacity = houses.reduce((total, house) => 
                            total + house.stations.reduce((stationTotal, station) => 
                              stationTotal + station.cells.reduce((cellTotal, cell) => 
                                cellTotal + cell.capacity, 0), 0), 0
                          );
                          const totalOccupied = houses.reduce((total, house) => 
                            total + house.stations.reduce((stationTotal, station) => 
                              stationTotal + station.cells.reduce((cellTotal, cell) => 
                                cellTotal + cell.assignments.length, 0), 0), 0
                          );
                          return `${totalOccupied} / ${totalCapacity}`;
                        })()}
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        {(() => {
                          const totalCapacity = houses.reduce((total, house) => 
                            total + house.stations.reduce((stationTotal, station) => 
                              stationTotal + station.cells.reduce((cellTotal, cell) => 
                                cellTotal + cell.capacity, 0), 0), 0
                          );
                          const totalOccupied = houses.reduce((total, house) => 
                            total + house.stations.reduce((stationTotal, station) => 
                              stationTotal + station.cells.reduce((cellTotal, cell) => 
                                cellTotal + cell.assignments.length, 0), 0), 0
                          );
                          const percentage = totalCapacity > 0 ? Math.round((totalCapacity - totalOccupied) / totalCapacity * 100) : 100;
                          return `${percentage}% verfügbar`;
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
             </div>

                         {/* Haus-Liste */}
             <div className="bg-white shadow rounded-lg">
               <div className="px-6 py-4 border-b border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900">Alle Häuser</h3>
               </div>
                                <div className="divide-y divide-gray-200">
                   {houses.map((house) => {
                    const totalCapacity = house.stations.reduce((total, station) => 
                      total + station.cells.reduce((cellTotal, cell) => cellTotal + cell.capacity, 0), 0
                    );
                    const totalOccupied = house.stations.reduce((total, station) => 
                      total + station.cells.reduce((cellTotal, cell) => cellTotal + cell.assignments.length, 0), 0
                    );
                    const availablePlaces = totalCapacity - totalOccupied;
                    const occupancyRate = totalCapacity > 0 ? (totalOccupied / totalCapacity * 100) : 0;
                    
                    return (
                      <div key={house.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">{house.name}</h4>
                            <p className="text-sm text-gray-600">{house.description}</p>
                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                {house._count.stations} Stationen
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {house.stations.reduce((total, station) => total + station._count.cells, 0)} Zellen
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {totalCapacity} Plätze
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500 mb-2">
                              <div className="flex items-center justify-end">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${100 - occupancyRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-green-600">
                                  {Math.round(100 - occupancyRate)}% frei
                                </span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {availablePlaces} von {totalCapacity} Plätzen verfügbar
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
               </div>
             </div>
          </div>
        )}

        {activeTab === 'houses' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Haus-Details</h2>
            <p className="text-gray-600 mb-6">
              Detaillierte Ansicht aller Häuser mit Stationen und Zellen
            </p>
            
                         {/* Haus-Details */}
             <div className="space-y-6">
               {filteredHouses.map((house) => (
                <div key={house.id} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* Haus-Header */}
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{house.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{house.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {house._count.stations} Stationen
                          </div>
                          <div className="mt-1">
                            {house.stations.reduce((total, station) => total + station._count.cells, 0)} Zellen
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                                     {/* Stationen */}
                   <div className="divide-y divide-gray-200">
                     {house.stations.map((station) => {
                       const totalCapacity = station.cells.reduce((total, cell) => total + cell.capacity, 0);
                       const totalOccupied = station.cells.reduce((total, cell) => total + cell.assignments.length, 0);
                       const availablePlaces = totalCapacity - totalOccupied;
                       
                       return (
                         <div key={station.id} className="px-6 py-4">
                           <div className="flex items-center justify-between">
                             <div>
                               <h4 className="text-lg font-medium text-gray-900">{station.name}</h4>
                               <p className="text-sm text-gray-600 mt-1">{station.description}</p>
                               <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                 <div className="flex items-center">
                                   <Users className="h-4 w-4 mr-1" />
                                   {station._count.cells} Zellen
                                 </div>
                                 <div className="flex items-center">
                                   <Users className="h-4 w-4 mr-1" />
                                   {totalCapacity} Plätze
                                 </div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm text-gray-500">
                                 <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                   {availablePlaces} von {totalCapacity} Plätzen verfügbar
                                 </div>
                               </div>
                             </div>
                           </div>
                           
                                                                                   {/* Zellen-Details */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {station.cells.map((cell) => (
                                <DropZone
                                  key={cell.id}
                                  cell={cell}
                                  onDrop={handleDrop}
                                  onAssign={openAssignmentModal}
                                >
                                                                      <CellCard
                                      cell={cell}
                                      onAssign={openAssignmentModal}
                                      onRemove={openRemoveModal}
                                      onTransfer={openTransferModal}
                                      onDragStart={handleDragStart}
                                    />
                                </DropZone>
                              ))}
                            </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

                 {activeTab === 'assignments' && (
           <div>
             <h2 className="text-2xl font-semibold text-gray-900 mb-6">Zellen-Zuweisungen</h2>
             <p className="text-gray-600 mb-6">
               Übersicht aller Insassen-Zuweisungen zu Zellen
             </p>
             
                            {/* Zuweisungen-Übersicht */}
               <div className="space-y-6">
                 {filteredHouses.map((house) => (
                 <div key={house.id} className="bg-white shadow rounded-lg overflow-hidden">
                   {/* Haus-Header */}
                   <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                     <h3 className="text-lg font-semibold text-gray-900">{house.name}</h3>
                     <p className="text-sm text-gray-600">{house.description}</p>
                   </div>
                   
                   {/* Stationen mit Zuweisungen */}
                   <div className="divide-y divide-gray-200">
                     {house.stations.map((station) => {
                       const assignmentsInStation = station.cells.reduce((total, cell) => 
                         total + cell.assignments.length, 0
                       );
                       
                       if (assignmentsInStation === 0) return null;
                       
                       return (
                         <div key={station.id} className="px-6 py-4">
                           <div className="mb-4">
                             <h4 className="text-md font-medium text-gray-900">{station.name}</h4>
                             <p className="text-sm text-gray-600">{station.description}</p>
                           </div>
                           
                           {/* Zellen mit Zuweisungen */}
                                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {station.cells
                               .filter(cell => cell.assignments.length > 0)
                               .map((cell) => (
                                 <DropZone
                                   key={cell.id}
                                   cell={cell}
                                   onDrop={handleDrop}
                                   onAssign={openAssignmentModal}
                                 >
                                   <CellCard
                                     cell={cell}
                                     onAssign={openAssignmentModal}
                                     onRemove={openRemoveModal}
                                     onTransfer={openTransferModal}
                                     onDragStart={handleDragStart}
                                   />
                                 </DropZone>
                               ))}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   
                   {/* Keine Zuweisungen */}
                   {house.stations.every(station => 
                     station.cells.every(cell => cell.assignments.length === 0)
                   ) && (
                     <div className="px-6 py-8 text-center">
                       <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                       <p className="text-gray-500">Keine Zuweisungen in diesem Haus</p>
                     </div>
                   )}
                 </div>
               ))}
             </div>
           </div>
         )}
       </div>

       {/* Modals */}
       <CellAssignmentModal
         isOpen={assignmentModalOpen}
         onClose={() => setAssignmentModalOpen(false)}
         cell={selectedCell}
         onAssign={handleAssignInmate}
       />
       
               <RemoveAssignmentModal
          isOpen={removeModalOpen}
          onClose={() => setRemoveModalOpen(false)}
          assignment={selectedAssignment}
          cellNumber={selectedCell?.number || ''}
          onRemove={handleRemoveAssignment}
        />
        
        <TransferModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          assignment={selectedAssignment}
          currentCell={selectedCell}
          onTransfer={handleTransfer}
        />
     </div>
   );
 };

export default HouseManagement;
