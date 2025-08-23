import React from 'react';
import { User, Plus, X, ArrowRight } from 'lucide-react';
import DraggableInmate from './DraggableInmate';

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

interface CellCardProps {
  cell: Cell;
  onAssign: (cell: Cell) => void;
  onRemove: (assignment: any, cellNumber: string) => void;
  onTransfer: (assignment: any, cell: Cell) => void;
  onDragStart: (e: React.DragEvent, assignmentId: number, inmate: any) => void;
}

const CellCard: React.FC<CellCardProps> = ({
  cell,
  onAssign,
  onRemove,
  onTransfer,
  onDragStart
}) => {
  const occupancyPercentage = (cell.assignments.length / cell.capacity) * 100;
  const isFull = cell.assignments.length >= cell.capacity;
  const isEmpty = cell.assignments.length === 0;

  // Farbkodierung basierend auf Belegung
  const getOccupancyColor = () => {
    if (isEmpty) return 'bg-gray-50 border-gray-200';
    if (isFull) return 'bg-teal-50 border-teal-200';
    if (occupancyPercentage >= 75) return 'bg-blue-50 border-blue-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getOccupancyTextColor = () => {
    if (isEmpty) return 'text-gray-700';
    if (isFull) return 'text-teal-700';
    if (occupancyPercentage >= 75) return 'text-blue-700';
    return 'text-blue-700';
  };

  const getOccupancyBarColor = () => {
    if (isEmpty) return 'bg-gray-500';
    if (isFull) return 'bg-teal-500';
    if (occupancyPercentage >= 75) return 'bg-blue-500';
    return 'bg-blue-500';
  };

  return (
    <div 
      className={`p-4 rounded-lg border-2 ${getOccupancyColor()} hover:shadow-md`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      {/* Zellen-Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">Zelle {cell.number}</h4>
          {cell.description && (
            <p className="text-sm text-gray-600">{cell.description}</p>
          )}
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getOccupancyTextColor()}`}>
            {cell.assignments.length}/{cell.capacity} belegt
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(occupancyPercentage)}% Auslastung
          </div>
        </div>
      </div>

      {/* Belegungsbalken */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getOccupancyBarColor()}`}
            style={{ width: `${occupancyPercentage}%` }}
          />
        </div>
      </div>

      {/* Insassen-Liste */}
      <div className="space-y-2 mb-3">
        {cell.assignments.length === 0 ? (
          <div className="text-center py-2 text-gray-500 text-sm">
            <User className="h-4 w-4 mx-auto mb-1 opacity-50" />
            Keine Insassen zugewiesen
          </div>
        ) : (
                     cell.assignments.map((assignment) => (
             <DraggableInmate
               key={assignment.id}
               inmate={assignment.user}
               assignmentId={assignment.id}
               onDragStart={onDragStart}
               onTransfer={onTransfer}
               onRemove={onRemove}
               cell={cell}
             />
           ))
        )}
      </div>

      {/* Zuweisen-Button */}
      <button
        onClick={() => onAssign(cell)}
        disabled={isFull}
        className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
          isFull
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md'
        }`}
      >
        <Plus className="h-4 w-4" />
        <span>{isFull ? 'Zelle voll' : 'Insasse zuweisen'}</span>
      </button>
    </div>
  );
};

export default CellCard;
