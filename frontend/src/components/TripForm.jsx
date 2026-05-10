import React, { useState } from 'react';
import { MapPin, Search, Truck, Navigation } from 'lucide-react';

const TripForm = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState({
    origin_address: '',
    pickup_address: '',
    dropoff_address: '',
    current_cycle_hours: 0
  });
  
  const [geocodedLocations, setGeocodedLocations] = useState({
    origin: null,
    pickup: null,
    dropoff: null
  });
  
  const [geocoding, setGeocoding] = useState({
    origin: false,
    pickup: false,
    dropoff: false
  });
  
  const [geocodingError, setGeocodingError] = useState('');

  const geocodeAddress = async (address, locationKey) => {
    if (!address.trim()) return null;
    
    setGeocoding(prev => ({ ...prev, [locationKey]: true }));
    setGeocodingError('');
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'SpotterAI-TruckRoutePlanner/1.0' } }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          address: data[0].display_name
        };
        
        setGeocodedLocations(prev => ({ ...prev, [locationKey]: result }));
        return result;
      } else {
        setGeocodingError(`Could not find location: ${address}`);
        return null;
      }
    } catch (err) {
      setGeocodingError(err.message);
      return null;
    } finally {
      setGeocoding(prev => ({ ...prev, [locationKey]: false }));
    }
  };
  
  const handleGeocode = async (field) => {
    const addressMap = {
      origin: formData.origin_address,
      pickup: formData.pickup_address,
      dropoff: formData.dropoff_address
    };
    await geocodeAddress(addressMap[field], field);
  };
  
  const handleSubmit = () => {
    if (!geocodedLocations.origin || !geocodedLocations.pickup || !geocodedLocations.dropoff) {
      setGeocodingError('Please geocode all locations first');
      return;
    }
    
    const submitData = {
      origin: geocodedLocations.origin,
      pickup: geocodedLocations.pickup,
      dropoff: geocodedLocations.dropoff,
      current_cycle_hours: parseFloat(formData.current_cycle_hours)
    };
    onSubmit(submitData);
  };
  
  const onEnterPress = (field) => {
    if (field === 'cycle') {
      if (geocodedLocations.origin && geocodedLocations.pickup && geocodedLocations.dropoff) {
        handleSubmit();
      }
    } else {
      handleGeocode(field);
    }
  };
  
  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-blue-900 mb-2">
          <Navigation size={16} />
          Current Location (Origin)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.origin_address}
            onChange={(e) => setFormData(prev => ({ ...prev, origin_address: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onEnterPress('origin')}
            placeholder="e.g., New York, NY"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => handleGeocode('origin')}
            disabled={geocoding.origin || !formData.origin_address}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </div>
        {geocodedLocations.origin && (
          <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            Lat: {geocodedLocations.origin.lat.toFixed(4)}, Lng: {geocodedLocations.origin.lng.toFixed(4)}
          </div>
        )}
      </div>
      
      <div className="bg-green-50 p-4 rounded-lg border border-green-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-green-900 mb-2">
          <Truck size={16} />
          Pickup Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.pickup_address}
            onChange={(e) => setFormData(prev => ({ ...prev, pickup_address: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onEnterPress('pickup')}
            placeholder="e.g., Newark, NJ (Warehouse)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => handleGeocode('pickup')}
            disabled={geocoding.pickup || !formData.pickup_address}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </div>
        {geocodedLocations.pickup && (
          <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            Lat: {geocodedLocations.pickup.lat.toFixed(4)}, Lng: {geocodedLocations.pickup.lng.toFixed(4)}
          </div>
        )}
      </div>
      
      <div className="bg-red-50 p-4 rounded-lg border border-red-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-red-900 mb-2">
          <MapPin size={16} />
          Dropoff Location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={formData.dropoff_address}
            onChange={(e) => setFormData(prev => ({ ...prev, dropoff_address: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && onEnterPress('dropoff')}
            placeholder="e.g., Philadelphia, PA"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => handleGeocode('dropoff')}
            disabled={geocoding.dropoff || !formData.dropoff_address}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <Search size={16} />
          </button>
        </div>
        {geocodedLocations.dropoff && (
          <div className="mt-2 text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
            Lat: {geocodedLocations.dropoff.lat.toFixed(4)}, Lng: {geocodedLocations.dropoff.lng.toFixed(4)}
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Current Cycle Hours Used (70hr/8day)
        </label>
        <input
          type="number"
          value={formData.current_cycle_hours}
          onChange={(e) => setFormData(prev => ({ ...prev, current_cycle_hours: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && onEnterPress('cycle')}
          min="0"
          max="70"
          step="0.5"
          className={inputClass}
        />
        <div className="mt-1 text-xs text-gray-500">
          Hours already used in current 8-day cycle
        </div>
      </div>
      
      {geocodingError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {geocodingError}
        </div>
      )}
      
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || !geocodedLocations.origin || !geocodedLocations.pickup || !geocodedLocations.dropoff}
        className="w-full py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⟳</span>
            Calculating...
          </>
        ) : (
          <>
            <Navigation size={18} />
            Calculate Route
          </>
        )}
      </button>
    </div>
  );
};

export default TripForm;