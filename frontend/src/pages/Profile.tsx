import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user } = useAuth();
  
  // Prüfe ob Benutzer ein Insasse ist
  const userGroups = user?.groups?.map(g => g.name) || [];
  const isInmate = userGroups.some(group => group === 'PS Inmates');
  
  // Wenn nicht Insasse, zur Login-Seite weiterleiten
  if (!isInmate) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kontoinformationen
            </h1>
            <div className="text-2xl text-gray-600 font-medium">
              Diese Seite befindet sich aktuell im Aufbau
            </div>
            <p className="text-lg text-gray-500 mt-4">
              und stellt nur einen Platzhalter dar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
