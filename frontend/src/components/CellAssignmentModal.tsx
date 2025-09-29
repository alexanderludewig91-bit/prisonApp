import React, { useState, useEffect } from 'react';
import { X, User, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  groups: { 
    group: {
      id: number;
      name: string;
      description: string;
      category: string;
      permissions: string;
      isActive: boolean;
    }
  }[];
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

interface CellAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cell: Cell | null;
  onAssign: (userId: number, notes: string) => Promise<void>;
}

const CellAssignmentModal: React.FC<CellAssignmentModalProps> = ({
  isOpen,
  onClose,
  cell,
  onAssign
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

    const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      // Nur nicht zugewiesene Insassen laden
      const response = await api.get('/users/inmates-unassigned');
      
      console.log('Insassen geladen:', response.data.users.length);
      console.log('Insassen:', response.data.users.map((u: User) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        groups: u.groups.map(g => g.group.name)
      })));
      
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
    } catch (err) {
      console.error('Fehler beim Laden der Benutzer:', err);
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Suchfunktion für Insassen
  const handleSearch = (searchValue: string) => {
    setSearchTerm(searchValue);
    setShowDropdown(true);
    
    if (!searchValue.trim()) {
      setFilteredUsers(users);
      return;
    }
    
    const filtered = users.filter(user => {
      const searchLower = searchValue.toLowerCase();
      return (
        user.firstName.toLowerCase().includes(searchLower) ||
        user.lastName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredUsers(filtered);
  };

  // Funktion zum Anzeigen aller Insassen beim Fokus
  const handleFocus = () => {
    setSearchTerm('');
    setFilteredUsers(users);
    setShowDropdown(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !cell) {
      setError('Bitte wählen Sie einen Insassen aus.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await onAssign(selectedUserId as number, notes);
      
      // Modal schließen und zurücksetzen
      setSelectedUserId('');
      setNotes('');
      setSearchTerm('');
      setFilteredUsers(users);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Zuweisen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !cell) {
    return null;
  }

  const availableSpots = cell.capacity - cell.assignments.length;
  const isFull = availableSpots <= 0;

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
              Zelle {cell.number} - {cell.description}
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
          {/* Zellen-Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{cell.number}</div>
                <div className="text-sm text-gray-600">{cell.description}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">
                  Kapazität: {cell.capacity}
                </div>
                <div className="text-sm text-gray-500">
                  Belegt: {cell.assignments.length}/{cell.capacity}
                </div>
              </div>
            </div>
            
            {isFull && (
              <div className="mt-3 flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Zelle ist voll - keine weiteren Zuweisungen möglich
              </div>
            )}
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

          {/* Insassen-Auswahl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insasse auswählen
            </label>
            
            {loadingUsers ? (
              <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
            ) : (
              <div className="relative">
                {/* Kombiniertes Suchfeld mit Dropdown */}
                                 <input
                   type="text"
                   placeholder="Insassen suchen oder auswählen..."
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
                {showDropdown && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSearchTerm(`${user.firstName} ${user.lastName} (${user.username})`);
                          setShowDropdown(false);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Keine Ergebnisse */}
                {showDropdown && searchTerm && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="px-3 py-2 text-gray-500 text-sm">
                      Keine Insassen gefunden
                    </div>
                  </div>
                )}
              </div>
            )}
            
                         <p className="text-xs text-gray-500 mt-1">
               {searchTerm ? `${filteredUsers.length} von ${users.length} Insassen gefunden` : `${filteredUsers.length} Insassen verfügbar`}
             </p>
          </div>

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
                setFilteredUsers(users);
                onClose();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isFull || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Zuweisen...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
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

export default CellAssignmentModal;
