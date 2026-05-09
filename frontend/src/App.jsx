import React, { useState } from 'react';
import { Truck, Map, Calendar, Clock, Fuel } from 'lucide-react';
import TripForm from './components/TripForm';
import HOSGrid from './components/HOSGrid';
import RouteMap from './components/RouteMap';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [tripLocations, setTripLocations] = useState(null);

  const calculateTrip = async (formData) => {
    setLoading(true);
    setError(null);
    setTripLocations({
      origin: formData.origin,
      pickup: formData.pickup,
      dropoff: formData.dropoff
    });

    try {
      const response = await fetch(`${API_URL}/api/calculate-trip/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to calculate trip');

      const data = await response.json();
      setTripData(data);
      setSelectedDayIndex(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const currentLog = tripData?.daily_logs?.[selectedDayIndex];
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-800 rounded-lg">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Spotter AI</h1>
              <p className="text-xs text-blue-200">Truck Route Planner & ELD Logs</p>
            </div>
          </div>
          <div className="text-sm text-blue-200">
            HOS Compliant Route Calculator
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Map size={18} />
                Trip Details
              </h2>
              <TripForm onSubmit={calculateTrip} loading={loading} />
            </div>
          </div>
          
          <div className="lg:col-span-8 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}
            
            {tripData && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Map size={16} />
                      Total Distance
                    </div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">
                      {tripData.total_distance_miles?.toFixed(0)} mi
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Clock size={16} />
                      Est. Duration
                    </div>
                    <div className="text-2xl font-bold text-green-700 mt-1">
                      {tripData.estimated_duration_hours?.toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Calendar size={16} />
                      Cycle Used
                    </div>
                    <div className="text-2xl font-bold text-orange-600 mt-1">
                      {tripData.current_cycle_hours?.toFixed(1)} hrs
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <Fuel size={16} />
                      Available
                    </div>
                    <div className="text-2xl font-bold text-purple-700 mt-1">
                      {Math.max(0, 70 - tripData.current_cycle_hours).toFixed(1)} hrs
                    </div>
                  </div>
                </div>
                
                {tripData && tripLocations && (
                  <RouteMap
                    events={tripData.events}
                    origin={tripLocations.origin}
                    pickup={tripLocations.pickup}
                    dropoff={tripLocations.dropoff}
                  />
                )}
                
                {tripData.daily_logs?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar size={18} />
                        Daily Logs ({tripData.daily_logs.length} day{tripData.daily_logs.length > 1 ? 's' : ''})
                      </h2>
                      
                      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {tripData.daily_logs.map((log, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedDayIndex(idx)}
                            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                              selectedDayIndex === idx
                                ? 'bg-blue-900 text-white'
                                : 'text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            Day {log.day}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
                      {tripData.daily_logs.map((log, idx) => (
                        <div 
                          key={idx} 
                          className={`flex-shrink-0 transition-opacity cursor-pointer ${
                            selectedDayIndex === idx ? 'opacity-100 ring-2 ring-blue-500' : 'opacity-50'
                          }`}
                          onClick={() => setSelectedDayIndex(idx)}
                        >
                          <HOSGrid
                            gridData={log.grid_data}
                            date={log.date}
                            totalMiles={log.total_miles}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-sm text-gray-500">Day Progress:</span>
                      <div className="flex gap-1">
                        {tripData.daily_logs.map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2 w-8 rounded-full ${
                              idx <= selectedDayIndex ? 'bg-blue-900' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {tripData.events?.length > 0 && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Clock size={18} />
                      Route Timeline
                    </h2>
                    <div className="space-y-3">
                      {tripData.events.map((event, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            event.type === 'DRIVING' ? 'bg-blue-900' :
                            event.type === 'OFF_DUTY' ? 'bg-gray-400' :
                            event.type === 'SLEEPER' ? 'bg-gray-300' :
                            'bg-orange-500'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-800">
                                {event.timestamp?.split('T')[1]?.substring(0, 5) || '00:00'}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                event.type === 'DRIVING' ? 'bg-blue-100 text-blue-800' :
                                event.type === 'OFF_DUTY' ? 'bg-gray-200 text-gray-600' :
                                event.type === 'SLEEPER' ? 'bg-gray-100 text-gray-500' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {event.type}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Map size={10} />
                              {event.location}
                            </p>
                          </div>
                          {event.miles_driven > 0 && (
                            <div className="text-sm text-gray-500 font-medium">
                              {event.miles_driven.toFixed(0)} mi
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {!tripData && !loading && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="p-4 bg-blue-50 rounded-full w-16 h-16 mx-auto mb-4">
                  <Truck size={32} className="text-blue-900 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Enter Trip Details
                </h3>
                <p className="text-gray-500">
                  Fill out the form to calculate your HOS-compliant route and generate ELD logs.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;