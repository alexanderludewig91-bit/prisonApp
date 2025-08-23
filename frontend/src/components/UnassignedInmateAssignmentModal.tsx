import React, { useState, useEffect } from 'react';
import { X, Building, MapPin, User, AlertCircle, Search } from 'lucide-react';

interface Inmate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  createdAt: string;
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
  station: {
    id: number;
    name: string;
    house: {
      id: number;
      name: string;
    };
  };
}

interface UnassignedInmateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  inmate: Inmate | null;
  onAssign: (inmateId: number, cellId: number, notes: string) => Promise<void>;
}

const UnassignedInmateAssignmentModal: React.FC<UnassignedInmateAssignmentModalProps> = ({
  isOpen,
  onClose,
  inmate,
  onAssign
}) => {
  const [availableCells, setAvailableCells] = useState<Cell[]>([]);
  const [filteredCells, setFilteredCells] = useState<Cell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCells, setLoadingCells] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableCells();
    }
  }, [isOpen]);

  const fetchAvailableCells = async () => {
    try {
      setLoadingCells(true);
      setError(null);
      
      // Alle Häuser mit verfügbaren Zellen laden
      const response = await fetch('/api/houses');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der verfügbaren Zellen');
      }

      const data = await response.json();
      
      // Alle verfügbaren Zellen extrahieren (nicht voll belegt)
      const cells: Cell[] = [];
      data.houses.forEach((house: any) => {
        house.stations.forEach((station: any) => {
          station.cells.forEach((cell: any) => {
            if (cell.assignments.length < cell.capacity) {
              cells.push({
                ...cell,
                station: {
                  id: station.id,
                  name: station.name,
                  house: {
                    id: house.id,
                    name: house.name
                  }
                }
              });
            }
          });
        });
      });
      
      setAvailableCells(cells);
      setFilteredCells(cells);
    } catch (err) {
      console.error('Fehler beim Laden der verfügbaren Zellen:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoadingCells(false);
    }
  };

  // Suchfunktion für Zellen
  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setShowDropdown(true);
    
    if (!searchValue.trim()) {
      setFilteredCells(availableCells);
      return;
    }
    
    const filtered = availableCells.filter(cell => {
      const searchLower = searchValue.toLowerCase();
      return (
        cell.number.toLowerCase().includes(searchLower) ||
        cell.description.toLowerCase().includes(searchLower) ||
        cell.station.name.toLowerCase().includes(searchLower) ||
        cell.station.house.name.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredCells(filtered);
  };

  // Funktion zum Anzeigen aller Zellen beim Fokus
  const handleFocus = () => {
    setSearchTerm('');
    setFilteredCells(availableCells);
    setShowDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCellId || !inmate) {
      setError('Bitte wählen Sie eine Zelle aus.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onAssign(inmate.id, selectedCellId as number, notes);
      
      // Modal schließen und zurücksetzen
      setSelectedCellId('');
      setNotes('');
      setSearchTerm('');
      setFilteredCells(availableCells);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Zuweisen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !inmate) {
    return null;
  }

  const selectedCell = availableCells.find(cell => cell.id === selectedCellId);
  const availableSpots = selectedCell ? selectedCell.capacity - selectedCell.assignments.length : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Insasse zuweisen
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {inmate.firstName} {inmate.lastName} ({inmate.username})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Insassen-Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">
                  {inmate.firstName} {inmate.lastName}
                </div>
                <div className="text-sm text-gray-600">{inmate.username}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Aufgenommen: {new Date(inmate.createdAt).toLocaleDateString('de-DE')}
                </div>
              </div>
            </div>
          </div>

          {/* Fehler */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}

          {/* Zellen-Auswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zelle auswählen
            </label>
            
            {loadingCells ? (
              <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
            ) : (
              <div className="relative">
                {/* Kombiniertes Suchfeld mit Dropdown */}
                <input
                  type="text"
                  placeholder="Zelle suchen oder auswählen..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleFocus}
                  onBlur={() => {
                    // Verzögerung, damit der Klick auf ein Dropdown-Item noch funktioniert
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                
                {/* Dropdown-Liste */}
                {showDropdown && filteredCells.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredCells.map((cell) => {
                      const availableSpots = cell.capacity - cell.assignments.length;
                      return (
                        <button
                          key={cell.id}
                          type="button"
                          onClick={() => {
                            setSelectedCellId(cell.id);
                            setSearchTerm(`${cell.number} - ${cell.station.house.name} / ${cell.station.name}`);
                            setShowDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            Zelle {cell.number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {cell.station.house.name} / {cell.station.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {availableSpots} von {cell.capacity} Plätzen verfügbar
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                
                {/* Keine Ergebnisse */}
                {showDropdown && searchTerm && filteredCells.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Keine verfügbaren Zellen gefunden
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-xs text-gray-500 mt-1">
              {searchTerm ? `${filteredCells.length} von ${availableCells.length} Zellen gefunden` : `${availableCells.length} verfügbare Zellen`}
            </p>
          </div>

          {/* Ausgewählte Zellen-Info */}
          {selectedCell && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    Zelle {selectedCell.number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedCell.description}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    <Building className="h-3 w-3 inline mr-1" />
                    {selectedCell.station.house.name} / {selectedCell.station.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Kapazität: {selectedCell.capacity}
                  </div>
                  <div className="text-sm text-gray-500">
                    Belegt: {selectedCell.assignments.length}/{selectedCell.capacity}
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    {availableSpots} Plätze frei
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Zusätzliche Informationen zur Zuweisung..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilteredCells(availableCells);
                onClose();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!selectedCellId || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Zuweisen...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  Zuweisen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnassignedInmateAssignmentModal;
