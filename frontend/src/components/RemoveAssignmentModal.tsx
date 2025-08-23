import React, { useState } from 'react';
import { X, User, AlertTriangle } from 'lucide-react';

interface Assignment {
  id: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
  };
}

interface RemoveAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  cellNumber: string;
  onRemove: (assignmentId: number) => Promise<void>;
}

const RemoveAssignmentModal: React.FC<RemoveAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  cellNumber,
  onRemove
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemove = async () => {
    if (!assignment) return;

    try {
      setLoading(true);
      setError(null);
      
      await onRemove(assignment.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Entfernen');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !assignment) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Zuweisung entfernen
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Zelle {cellNumber}
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
        <div className="p-6 space-y-6">
          {/* Warnung */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span className="font-medium">Achtung</span>
            </div>
            <p className="text-yellow-700 text-sm mt-2">
              Sie sind dabei, einen Insassen aus der Zelle zu entfernen. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>

          {/* Insassen-Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <User className="h-5 w-5 text-gray-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">
                  {assignment.user.firstName} {assignment.user.lastName}
                </div>
                <div className="text-sm text-gray-600">
                  {assignment.user.username}
                </div>
              </div>
            </div>
          </div>

          {/* Fehler */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4 mr-2" />
                {error}
              </div>
            </div>
          )}

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
              onClick={handleRemove}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Entfernen...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Zuweisung entfernen
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveAssignmentModal;
