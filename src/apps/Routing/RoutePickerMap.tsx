import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import type { RouteOption } from './RouteTypes';

interface RoutePickerMapProps {
  onSelectStart: (lat: number, lng: number) => void;
  onSelectEnd: (lat: number, lng: number) => void;
  centerTo?: [number, number];
  selectedRoute?: RouteOption | null;
}

const pinHtml = `
  <div style="transform: translate(-50%, -100%); width: 32px; height: 32px; color: #ef4444; drop-shadow: 0 4px 6px rgba(0,0,0,0.5);">
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  </div>
`;
const pinIcon = L.divIcon({ html: pinHtml, className: 'custom-pin', iconSize: [0, 0], iconAnchor: [0, 0] });

function MapController({ setPos, centerTo, gpsTrigger, selectedRoute }: { setPos: (pos: [number, number]) => void, centerTo?: [number, number], gpsTrigger: number, selectedRoute?: RouteOption | null }) {
  const map = useMapEvents({
    moveend: (e) => {
      const c = e.target.getCenter();
      setPos([c.lat, c.lng]);
    }
  });

  useEffect(() => {
    if (centerTo) {
      map.flyTo(centerTo, 15);
      setPos(centerTo);
    }
  }, [centerTo, map, setPos]);

  useEffect(() => {
    if (gpsTrigger > 0 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          map.flyTo(coords, 15);
          setPos(coords);
        },
        () => {}
      );
    }
  }, [gpsTrigger, map, setPos]);

  useEffect(() => {
    if (selectedRoute) {
      const allCoords: [number, number][] = [];
      selectedRoute.steps.forEach(step => {
        if (step.pathCoords) {
          allCoords.push(...step.pathCoords);
        }
      });
      if (allCoords.length > 0) {
        map.fitBounds(allCoords, { padding: [20, 20] });
      }
    }
  }, [selectedRoute, map]);

  return null;
}

export function RoutePickerMap({ onSelectStart, onSelectEnd, centerTo, selectedRoute }: RoutePickerMapProps) {
  const [center, setCenter] = useState<[number, number]>([37.5665, 126.9780]); // Default: Seoul City Hall
  const [gpsTrigger, setGpsTrigger] = useState(0);
  
  // Try to get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => {}
      );
    }
  }, []);

  const handleGpsClick = () => {
    setGpsTrigger(prev => prev + 1);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '16px' }}>
      <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
          attribution='&copy; V-World'
        />
        <MapController setPos={setCenter} centerTo={centerTo} gpsTrigger={gpsTrigger} selectedRoute={selectedRoute} />
        
        {/* Render Route Polylines */}
        {selectedRoute && selectedRoute.steps.map(step => {
          if (!step.pathCoords || step.pathCoords.length === 0) return null;
          return (
            <Polyline 
              key={step.id} 
              positions={step.pathCoords} 
              color={step.lineColor || '#6c5ce7'} 
              weight={6} 
              opacity={0.8} 
              lineCap="round"
              lineJoin="round"
            />
          );
        })}
      </MapContainer>
      
      {/* Center Crosshair / Pin Overlay */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 1000, pointerEvents: 'none', color: '#ef4444', filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))' }}>
        <MapPin size={32} fill="currentColor" color="white" />
      </div>

      {/* GPS Button */}
      <button 
        onClick={handleGpsClick}
        style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 1000, background: 'rgba(255,255,255,0.9)', color: '#000', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', cursor: 'pointer' }}
      >
        <Navigation size={20} />
      </button>

      {/* Action Buttons */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 1000 }}>
        <button
          onClick={() => onSelectStart(center[0], center[1])}
          style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}
        >
          출발지로 설정
        </button>
        <button
          onClick={() => onSelectEnd(center[0], center[1])}
          style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '8px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}
        >
          도착지로 설정
        </button>
      </div>
    </div>
  );
}
