import React, { useState } from 'react';
import { MapPin, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  OFF_DUTY: { 
    color: '#FFFFFF', 
    border: '#D1D5DB', 
    label: 'Off Duty',
    yPosition: 0 
  },
  SLEEPER: { 
    color: '#E5E7EB', 
    border: '#9CA3AF', 
    label: 'Sleeper Berth',
    yPosition: 1 
  },
  DRIVING: { 
    color: '#1E40AF', 
    border: '#1E3A8A', 
    label: 'Driving',
    yPosition: 2 
  },
  ON_DUTY: { 
    color: '#F59E0B', 
    border: '#D97706', 
    label: 'On Duty (Not Driving)',
    yPosition: 3 
  }
};

const HOSGrid = ({ gridData = [], date = '', totalMiles = 0 }) => {
  const [hoveredHour, setHoveredHour] = useState(null);
  
  const HOUR_WIDTH = 32;
  const LANE_HEIGHT = 36;
  const HEADER_HEIGHT = 40;
  const WIDTH = 24 * HOUR_WIDTH;
  const HEIGHT = 4 * LANE_HEIGHT + HEADER_HEIGHT + 80;
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getPolylinePoints = () => {
    if (!gridData || gridData.length === 0) return '';
    
    return gridData.map((entry, hour) => {
      const status = entry?.status || 'OFF_DUTY';
      const yPos = HEADER_HEIGHT + STATUS_CONFIG[status].yPosition * LANE_HEIGHT + LANE_HEIGHT / 2;
      const xPos = hour * HOUR_WIDTH + HOUR_WIDTH / 2;
      return `${xPos},${yPos}`;
    }).join(' ');
  };
  
  const getHoveredEntry = () => {
    if (hoveredHour === null || !gridData || !gridData[hoveredHour]) return null;
    return gridData[hoveredHour];
  };
  
  const hoveredEntry = getHoveredEntry();
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
        <span className="text-xs font-bold tracking-wider">U.S. DEPARTMENT OF TRANSPORTATION</span>
        <span className="text-sm font-medium">{date || '2026-05-08'}</span>
      </div>
      
      <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
        <h3 className="text-sm font-semibold text-gray-700">DRIVER'S DAILY LOG</h3>
        <div className="flex gap-4 text-xs text-gray-600 mt-1">
          <span>Total Miles: <strong>{totalMiles}</strong></span>
        </div>
      </div>
      
      <div className="relative">
        <svg 
          width={WIDTH} 
          height={HEIGHT - 50} 
          className="block"
        >
          {hours.map(hour => (
            <g key={`hour-${hour}`}>
              <text 
                x={hour * HOUR_WIDTH + HOUR_WIDTH / 2} 
                y={HEADER_HEIGHT - 8}
                textAnchor="middle" 
                className="text-xs fill-gray-500 font-medium"
              >
                {hour === 0 ? 24 : hour}
              </text>
              <line 
                x1={hour * HOUR_WIDTH} 
                y1={HEADER_HEIGHT} 
                x2={hour * HOUR_WIDTH} 
                y2={HEIGHT - 80}
                stroke="#E5E7EB" 
                strokeWidth="1"
              />
            </g>
          ))}
          
          {Object.keys(STATUS_CONFIG).map((status) => (
            <rect
              key={`lane-${status}`}
              x="0"
              y={HEADER_HEIGHT + STATUS_CONFIG[status].yPosition * LANE_HEIGHT}
              width={WIDTH}
              height={LANE_HEIGHT}
              fill={STATUS_CONFIG[status].color}
              stroke={STATUS_CONFIG[status].border}
              strokeWidth="1"
            />
          ))}
          
          <polyline
            points={getPolylinePoints()}
            fill="none"
            stroke="#1F2937"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {gridData.map((entry, hour) => {
            if (hour === 0) return null;
            const currentStatus = entry?.status || 'OFF_DUTY';
            const prevStatus = gridData[hour - 1]?.status || 'OFF_DUTY';
            if (currentStatus === prevStatus) return null;
            
            const xPos = hour * HOUR_WIDTH + HOUR_WIDTH / 2;
            const yStart = HEADER_HEIGHT + STATUS_CONFIG[prevStatus].yPosition * LANE_HEIGHT + LANE_HEIGHT / 2;
            const yEnd = HEADER_HEIGHT + STATUS_CONFIG[currentStatus].yPosition * LANE_HEIGHT + LANE_HEIGHT / 2;
            
            return (
              <line
                key={`vline-${hour}`}
                x1={xPos}
                y1={yStart}
                x2={xPos}
                y2={yEnd}
                stroke="#1F2937"
                strokeWidth="2"
              />
            );
          })}
          
          {hours.map(hour => (
            <rect
              key={`hover-${hour}`}
              x={hour * HOUR_WIDTH}
              y={HEADER_HEIGHT}
              width={HOUR_WIDTH}
              height={4 * LANE_HEIGHT}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
            />
          ))}
        </svg>
        
        {hoveredHour !== null && hoveredEntry && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1 font-semibold">
                <Clock size={12} />
                Hour {hoveredHour}:00 - {STATUS_CONFIG[hoveredEntry.status]?.label}
              </div>
              {hoveredEntry.location && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin size={10} />
                  {hoveredEntry.location}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex border-t border-gray-300">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => (
          <div 
            key={`label-${status}`}
            className="flex-1 py-2 text-center text-xs font-medium border-r border-gray-200 last:border-r-0"
            style={{ backgroundColor: config.color }}
          >
            <span className="text-gray-700">{config.label}</span>
          </div>
        ))}
      </div>
      
      <div className="bg-gray-50 px-4 py-2 border-t border-gray-300 flex justify-between text-xs text-gray-500">
        <span>ORIGINAL - Submit to carrier within 13 days</span>
        <span>DUPLICATE - Driver retains for 8 days</span>
      </div>
    </div>
  );
};

export default HOSGrid;