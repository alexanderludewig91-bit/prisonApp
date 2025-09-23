import React, { useState } from 'react';
import { User } from 'lucide-react';

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

interface DropZoneProps {
  cell: Cell;
  onDrop: (cellId: number, assignmentId: number) => void;
  onAssign: (cell: Cell) => void;
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({
  cell,
  onDrop,
  // onAssign,
  children
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isValidDrop, setIsValidDrop] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Nur setzen wenn sich der Zustand ändert
    if (!isDragOver) {
      setIsDragOver(true);
      
      // Prüfen, ob Drop gültig ist (Zelle nicht voll)
      const isFull = cell.assignments.length >= cell.capacity;
      setIsValidDrop(!isFull);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Nur setzen wenn sich der Zustand ändert
    if (!isDragOver) {
      setIsDragOver(true);
      
      // Prüfen, ob Drop gültig ist (Zelle nicht voll)
      const isFull = cell.assignments.length >= cell.capacity;
      setIsValidDrop(!isFull);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Nur setzen wenn sich der Zustand ändert
    if (isDragOver) {
      setIsDragOver(false);
      setIsValidDrop(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setIsValidDrop(false);

    const assignmentId = e.dataTransfer.getData('assignmentId');
    console.log('Drop event:', { assignmentId, cellId: cell.id, cellCapacity: cell.capacity, currentAssignments: cell.assignments.length });
    
    if (assignmentId && cell.assignments.length < cell.capacity) {
      onDrop(cell.id, parseInt(assignmentId));
    }
  };

  const getDropZoneClasses = () => {
    let baseClasses = 'relative';
    
    if (isDragOver) {
      if (isValidDrop) {
        return `${baseClasses} ring-2 ring-teal-400 ring-opacity-50`;
      } else {
        return `${baseClasses} ring-2 ring-gray-400 ring-opacity-50`;
      }
    }
    
    return baseClasses;
  };

  return (
         <div
       className={getDropZoneClasses()}
       onDragEnter={handleDragEnter}
       onDragOver={handleDragOver}
       onDragLeave={handleDragLeave}
       onDrop={handleDrop}
     >
      {children}
      
             {/* Drop-Indikator - nur ein kleiner Hinweis */}
       {isDragOver && (
         <div className={`absolute top-2 right-2 z-10 ${
           isValidDrop ? 'text-teal-600' : 'text-gray-600'
         }`}>
           {isValidDrop ? (
             <div className="bg-teal-100 border border-teal-300 rounded-full p-1">
               <User className="h-4 w-4" />
             </div>
           ) : (
             <div className="bg-gray-100 border border-gray-300 rounded-full p-1">
               <User className="h-4 w-4" />
             </div>
           )}
         </div>
       )}
    </div>
  );
};

export default DropZone;
