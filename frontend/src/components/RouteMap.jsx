import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const createCustomIcon = (emoji, bgColor) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${bgColor};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const originIcon = createCustomIcon('📍', '#1E40AF');
const pickupIcon = createCustomIcon('📦', '#059669');
const dropoffIcon = createCustomIcon('🎯', '#DC2626');

const RouteMap = ({ events = [], origin = null, pickup = null, dropoff = null }) => {
  const getRouteCoordinates = () => {
    const coords = [];
    if (origin?.lat && origin?.lng && !isNaN(origin.lat) && !isNaN(origin.lng)) {
      coords.push([origin.lat, origin.lng]);
    }
    if (pickup?.lat && pickup?.lng && !isNaN(pickup.lat) && !isNaN(pickup.lng)) {
      coords.push([pickup.lat, pickup.lng]);
    }
    if (dropoff?.lat && dropoff?.lng && !isNaN(dropoff.lat) && !isNaN(dropoff.lng)) {
      coords.push([dropoff.lat, dropoff.lng]);
    }
    return coords;
  };

  const getCenter = () => {
    const coords = getRouteCoordinates();
    if (coords.length > 0) {
      const validCoords = coords.filter(c => !isNaN(c[0]) && !isNaN(c[1]));
      if (validCoords.length > 0) {
        const avgLat = validCoords.reduce((sum, c) => sum + c[0], 0) / validCoords.length;
        const avgLng = validCoords.reduce((sum, c) => sum + c[1], 0) / validCoords.length;
        return [avgLat, avgLng];
      }
    }
    return [39.8283, -98.5795];
  };

  const getZoom = () => {
    const coords = getRouteCoordinates();
    if (coords.length < 2) return 4;
    if (coords.length === 2) return 6;
    return 5;
  };

  const routeCoords = getRouteCoordinates();

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <MapPin size={16} />
          Route Map
        </h3>
      </div>

      <div className="h-80 relative">
        <MapContainer
          center={getCenter()}
          zoom={getZoom()}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {origin && (
            <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>📍 Origin</strong>
                  <p className="text-gray-600">{origin.address || 'Starting point'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>📦 Pickup</strong>
                  <p className="text-gray-600">{pickup.address || 'Pickup location'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {dropoff && (
            <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
              <Popup>
                <div className="text-sm">
                  <strong>🎯 Dropoff</strong>
                  <p className="text-gray-600">{dropoff.address || 'Destination'}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {routeCoords.length > 1 && (
            <Polyline
              positions={routeCoords}
              color="#1E40AF"
              weight={4}
              opacity={0.8}
            />
          )}
        </MapContainer>
      </div>

      <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex gap-4 text-xs">
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div> Origin 📍
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-600"></div> Pickup 📦
        </span>
        <span className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-600"></div> Dropoff 🎯
        </span>
      </div>
    </div>
  );
};

export default RouteMap;