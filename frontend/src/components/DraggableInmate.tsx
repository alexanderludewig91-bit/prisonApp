import React from 'react';
import { User, GripVertical, ArrowRight, X } from 'lucide-react';

interface Inmate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

interface DraggableInmateProps {
  inmate: Inmate;
  assignmentId: number;
  onDragStart: (e: React.DragEvent, assignmentId: number, inmate: Inmate) => void;
  onTransfer?: (assignment: any, cell: any) => void;
  onRemove?: (assignment: any, cellNumber: string) => void;
  cell?: any;
}

const DraggableInmate: React.FC<DraggableInmateProps> = ({
  inmate,
  assignmentId,
  onDragStart,
  onTransfer,
  onRemove,
  cell
}) => {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart(e, assignmentId, inmate);
      }}
      className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-50 transition-colors cursor-move group"
    >
      <div className="flex items-center space-x-2">
        <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
        <User className="h-4 w-4 text-gray-500" />
        <div>
          <div className="text-sm font-medium text-gray-900">
            {inmate.firstName} {inmate.lastName}
          </div>
          <div className="text-xs text-gray-500">
            @{inmate.username}
          </div>
        </div>
      </div>
             <div className="flex items-center space-x-1">
         {onTransfer && cell && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               onTransfer({ id: assignmentId, user: inmate }, cell);
             }}
             className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
             title="Insasse verlegen"
           >
             <ArrowRight className="h-3 w-3" />
           </button>
         )}
         {onRemove && cell && (
           <button
             onClick={(e) => {
               e.stopPropagation();
               onRemove({ id: assignmentId, user: inmate }, cell.number);
             }}
             className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
             title="Zuweisung entfernen"
           >
             <X className="h-3 w-3" />
           </button>
         )}

       </div>
    </div>
  );
};

export default DraggableInmate;
