import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BusLocation } from './BusTrackerCard';

interface BusMapViewProps {
  locations: BusLocation[];
}

// Function to create a custom divIcon for a bus
const createBusIcon = (isMoving: boolean, angle: number) => {
  const color = isMoving ? '#10b981' : '#6b7280'; // Green if moving, Gray if stopped
  const html = `
    <div style="
      width: 32px; height: 32px; 
      background: ${color}; 
      border-radius: 50%; 
      display: flex; justify-content: center; align-items: center;
      border: 3px solid #fff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.5);
      transform: rotate(${angle}deg);
      transition: transform 0.5s ease;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L12 12"></path>
        <path d="M12 2L16 6"></path>
        <path d="M12 2L8 6"></path>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-bus-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Component to recenter map when locations change
const RecenterMap = ({ locations }: { locations: BusLocation[] }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [parseFloat(loc.lat), parseFloat(loc.lot)]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [locations, map]);

  return null;
};

export function BusMapView({ locations }: BusMapViewProps) {
  // Default center (Ulsan City Hall roughly if no locations)
  const defaultCenter: [number, number] = [35.5396, 129.3115]; 
  const center = locations.length > 0 
    ? [parseFloat(locations[0].lat), parseFloat(locations[0].lot)] as [number, number]
    : defaultCenter;

  return (
    <div style={{ 
      width: '100%', height: '300px', 
      borderRadius: '16px', overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '16px'
    }}>
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
          attribution='&copy; V-World'
        />
        
        <RecenterMap locations={locations} />

        {locations.map((loc) => {
          const speed = parseInt(loc.oprSpd, 10) || 0;
          const isMoving = speed > 0;
          // Direction angle: 0 is North, 90 is East, etc.
          // The API provides `oprDrct` but sometimes it might be missing or in degrees.
          // In `rtm_loc_info`, `oprDrct` is typically 0-359.
          const angle = parseInt(loc.oprDrct || '0', 10);
          
          return (
            <Marker 
              key={loc.vhclNo} 
              position={[parseFloat(loc.lat), parseFloat(loc.lot)]}
              icon={createBusIcon(isMoving, angle)}
            >
              <Popup className="bus-popup">
                <div style={{ color: '#000', fontWeight: 'bold' }}>차량: {loc.vhclNo}</div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>속도: {speed} km/h</div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>업데이트: {loc.gthrDt.split(' ')[1]}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
