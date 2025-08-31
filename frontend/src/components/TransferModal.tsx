import React, { useState, useEffect } from 'react';
import { X, User, ArrowRight, AlertCircle } from 'lucide-react';

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
  station?: {
    id: number;
    name: string;
    house: {
      id: number;
      name: string;
    };
  };
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: {
    id: number;
    user: {
      id: number;
      firstName: string;
      lastName: string;
      username: string;
    };
  } | null;
  currentCell: Cell | null;
  onTransfer: (assignmentId: number, targetCellId: number, notes: string) => Promise<void>;
}

const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  assignment,
  currentCell,
  onTransfer
}) => {
  const [availableCells, setAvailableCells] = useState<Cell[]>([]);
  const [selectedCellId, setSelectedCellId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
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
      const response = await fetch('/api/houses');
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Zellen');
      }

      const data = await response.json();
      
      // Alle Zellen extrahieren und verfügbare filtern
      const allCells: Cell[] = [];
      data.houses.forEach((house: any) => {
        house.stations.forEach((station: any) => {
          station.cells.forEach((cell: any) => {
            allCells.push({
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
          });
        });
      });

      // Nur Zellen mit freien Plätzen und nicht die aktuelle Zelle
      const available = allCells.filter(cell => {
        const availableSpots = cell.capacity - cell.assignments.length;
        return availableSpots > 0 && cell.id !== currentCell?.id;
      });

      setAvailableCells(available);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoadingCells(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCellId || !assignment) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onTransfer(assignment.id, selectedCellId as number, notes);
      
      // Modal schließen und zurücksetzen
      setSelectedCellId('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Verlegen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !assignment || !currentCell) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Insasse verlegen
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {assignment.user.firstName} {assignment.user.lastName}
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
          {/* Aktuelle Zelle */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Aktuelle Zelle</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{currentCell.number}</div>
                <div className="text-sm text-gray-600">{currentCell.description}</div>
                <div className="text-xs text-gray-500">
                  {currentCell.station?.name || 'Unbekannte Station'} - {currentCell.station?.house?.name || 'Unbekanntes Haus'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Belegt: {currentCell.assignments.length}/{currentCell.capacity}
                </div>
              </div>
            </div>
          </div>

          {/* Pfeil */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-gray-400" />
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

          {/* Ziel-Zelle auswählen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ziel-Zelle auswählen
            </label>
            {loadingCells ? (
              <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
            ) : (
              <select
                value={selectedCellId}
                onChange={(e) => setSelectedCellId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Ziel-Zelle auswählen...</option>
                {availableCells.map((cell) => (
                  <option key={cell.id} value={cell.id}>
                    {cell.number} - {cell.description} ({cell.station?.name}, {cell.station?.house.name}) - {cell.capacity - cell.assignments.length} Plätze frei
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {availableCells.length} verfügbare Zellen
            </p>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verlegungsgrund (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Grund für die Verlegung..."
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
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
                  Verlegen...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Verlegen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
