import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, ChevronDown } from 'lucide-react';
import AnimatedBorder from '../Layout/AnimatedBorder';
import { getAllAreas, getLocationsByArea, getLocationsWithinRadius } from '../../services/api';

const LocationSelector = ({ onLocationSelect }) => {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAreas();
  }, []);

  const loadAreas = async () => {
    try {
      const data = await getAllAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const handleAreaSelect = async (area) => {
    setSelectedArea(area);
    setSearchTerm(area);
    setDropdownOpen(false);
    setUseCurrentLocation(false);
    setLoading(true);

    try {
      const data = await getLocationsByArea(area);
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setSelectedArea('');
      setSearchTerm('');
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUseCurrentLocation(true);

          try {
            const nearbyLocations = await getLocationsWithinRadius(
              coords.latitude,
              coords.longitude,
              5
            );
            setLocations(nearbyLocations);
            
            if (nearbyLocations.length === 0) {
              alert('No parking locations found within 5km of your location.');
            }
          } catch (error) {
            console.error('Error loading nearby locations:', error);
            alert('Unable to load nearby locations. Please try selecting an area manually.');
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services or select an area manually.');
          setLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please select an area manually.');
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  const filteredAreas = areas.filter(area =>
    area.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-silver-light">Select Parking Location</h2>
        <button
          onClick={handleUseCurrentLocation}
          disabled={loading}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg hover:border-silver transition-colors disabled:opacity-50"
        >
          <Navigation className="w-4 h-4" />
          <span>{useCurrentLocation ? 'Using Current Location' : 'Use My Location'}</span>
        </button>
      </div>

      {/* Area Dropdown Search */}
      {!useCurrentLocation && (
        <AnimatedBorder className="bg-dark-card rounded-xl p-6">
          <label className="block text-silver mb-3 flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span className="font-medium">Search by Area</span>
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Type to search areas (e.g., Indiranagar, MG Road...)"
              className="w-full bg-dark-bg border-2 border-dark-border rounded-lg px-4 py-3 pr-10 text-silver-light focus:outline-none focus:border-silver transition-colors"
            />
            <ChevronDown 
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-silver-dark transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />

            {/* Dropdown */}
            {dropdownOpen && filteredAreas.length > 0 && (
              <div className="absolute z-10 w-full mt-2 bg-dark-card border border-dark-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredAreas.map((area) => (
                  <button
                    key={area}
                    onClick={() => handleAreaSelect(area)}
                    className="w-full text-left px-4 py-3 hover:bg-dark-bg transition-colors text-silver-light border-b border-dark-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-silver-dark" />
                      <span>{area}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {dropdownOpen && filteredAreas.length === 0 && searchTerm && (
              <div className="absolute z-10 w-full mt-2 bg-dark-card border border-dark-border rounded-lg shadow-lg p-4 text-center text-silver-dark">
                No areas found matching "{searchTerm}"
              </div>
            )}
          </div>

          {selectedArea && (
            <div className="mt-4 bg-dark-bg rounded-lg p-3 border border-silver/30">
              <p className="text-sm text-silver-dark">Selected Area:</p>
              <p className="text-silver-light font-semibold flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1 text-silver" /> {selectedArea}
              </p>
            </div>
          )}
        </AnimatedBorder>
      )}

      {/* Current Location Info */}
      {useCurrentLocation && (
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-center space-x-3">
          <Navigation className="w-5 h-5 text-blue-400 animate-pulse" />
          <p className="text-blue-400">
            Showing parking locations within 5km of your current location
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-silver border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-silver">Loading parking locations...</p>
        </div>
      )}

      {/* Locations Grid */}
      {!loading && locations.length === 0 && (selectedArea || useCurrentLocation) && (
        <div className="text-center py-12 text-silver-dark">
          <MapPin className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No parking locations available in this area</p>
        </div>
      )}

      {!loading && locations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-silver">
              Found <span className="font-bold text-silver-light">{locations.length}</span> parking location{locations.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <button
                key={location._id}
                onClick={() => handleLocationSelect(location)}
                className="text-left w-full"
              >
                <AnimatedBorder
                  className={`bg-dark-card rounded-lg p-6 cursor-pointer transition-all h-full ${
                    selectedLocation?._id === location._id
                      ? 'ring-2 ring-silver bg-dark-border'
                      : 'border border-dark-border hover:border-silver'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-6 h-6 text-silver flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-silver-light mb-1">
                        {location.name}
                      </h3>
                      <p className="text-sm text-silver-dark mb-3">{location.address}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-silver">Available Slots:</span>
                          <span className={`font-bold ${location.availableSlots > 20 ? 'text-green-400' : location.availableSlots > 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {location.availableSlots}/{location.totalSlots}
                          </span>
                        </div>
                        
                        {location.distance && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-silver-dark">Distance:</span>
                            <span className="text-silver">{location.distance.toFixed(1)} km</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-silver-dark">Floors:</span>
                          <span className="text-silver">{location.floors}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedBorder>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selection Confirmation */}
      {selectedLocation && (
        <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-green-400">
            Selected: <span className="font-semibold">{selectedLocation.name}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;