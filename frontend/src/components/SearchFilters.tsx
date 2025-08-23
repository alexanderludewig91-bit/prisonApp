import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedHouse: string;
  onHouseChange: (house: string) => void;
  selectedStation: string;
  onStationChange: (station: string) => void;
  occupancyFilter: string;
  onOccupancyFilterChange: (filter: string) => void;
  houses: Array<{ id: number; name: string }>;
  stations: Array<{ id: number; name: string; houseId: number }>;
  onClearFilters: () => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedHouse,
  onHouseChange,
  selectedStation,
  onStationChange,
  occupancyFilter,
  onOccupancyFilterChange,
  houses,
  stations,
  onClearFilters
}) => {
  const hasActiveFilters = searchTerm || selectedHouse || selectedStation || occupancyFilter !== 'all';

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Suche & Filter</h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Filter zurücksetzen
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Suchfeld */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Suche
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Insasse, Zelle, Station..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Haus-Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Haus
          </label>
          <select
            value={selectedHouse}
            onChange={(e) => onHouseChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Alle Häuser</option>
            {houses.map((house) => (
              <option key={house.id} value={house.id.toString()}>
                {house.name}
              </option>
            ))}
          </select>
        </div>

        {/* Station-Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Station
          </label>
          <select
            value={selectedStation}
            onChange={(e) => onStationChange(e.target.value)}
            disabled={!selectedHouse}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Alle Stationen</option>
            {stations
              .filter(station => !selectedHouse || station.houseId.toString() === selectedHouse)
              .map((station) => (
                <option key={station.id} value={station.id.toString()}>
                  {station.name}
                </option>
              ))}
          </select>
        </div>

        {/* Belegungs-Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Belegung
          </label>
          <select
            value={occupancyFilter}
            onChange={(e) => onOccupancyFilterChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Alle Zellen</option>
            <option value="empty">Freie Zellen</option>
            <option value="partial">Teilweise belegte Zellen</option>
            <option value="full">Belegte Zellen</option>
          </select>
        </div>
      </div>

      {/* Aktive Filter anzeigen */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Suche: "{searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedHouse && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Haus: {houses.find(h => h.id.toString() === selectedHouse)?.name}
                <button
                  onClick={() => onHouseChange('')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedStation && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Station: {stations.find(s => s.id.toString() === selectedStation)?.name}
                <button
                  onClick={() => onStationChange('')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {occupancyFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Belegung: {
                  occupancyFilter === 'empty' ? 'Frei' :
                  occupancyFilter === 'partial' ? 'Teilweise belegt' :
                  occupancyFilter === 'full' ? 'Belegt' : ''
                }
                <button
                  onClick={() => onOccupancyFilterChange('all')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
