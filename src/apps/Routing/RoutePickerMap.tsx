import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, Polyline, useMap, Marker, Popup, Pane } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';
import type { RouteOption } from './RouteTypes';

const busHtml = `
  <div style="width: 28px; height: 28px; background-color: #10b981; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; color: white;">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
    </svg>
  </div>
`;
const busIcon = L.divIcon({ html: busHtml, className: 'custom-bus-pin', iconSize: [28, 28], iconAnchor: [14, 14] });

const startHtml = `<div style="width: 14px; height: 14px; background-color: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`;
const endHtml = `<div style="width: 14px; height: 14px; background-color: #ef4444; border: 2px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>`;
const startIcon = L.divIcon({ html: startHtml, className: 'start-pin', iconSize: [14, 14], iconAnchor: [7, 7] });
const endIcon = L.divIcon({ html: endHtml, className: 'end-pin', iconSize: [14, 14], iconAnchor: [7, 7] });

interface RoutePickerMapProps {
  onSelectStart: (lat: number, lng: number) => void;
  onSelectEnd: (lat: number, lng: number) => void;
  centerTo?: [number, number];
  selectedRoute?: RouteOption | null;
  autoGps?: boolean;
  readonly?: boolean;
  onActiveBusesChange?: (buses: any[]) => void;
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

const gpsHtml = `
  <div style="width: 16px; height: 16px; background-color: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.4);"></div>
`;
const gpsIcon = L.divIcon({ html: gpsHtml, className: 'gps-pin', iconSize: [16, 16], iconAnchor: [8, 8] });

function MapController({ setPos, setGpsLoc, centerTo, gpsTrigger, selectedRoute, autoGps }: { setPos: (pos: [number, number]) => void, setGpsLoc?: (pos: [number, number]) => void, centerTo?: [number, number], gpsTrigger: number, selectedRoute?: RouteOption | null, autoGps?: boolean }) {
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

  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (gpsTrigger > 0 && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          map.flyTo(coords, 15);
          setPos(coords);
          if (setGpsLoc) setGpsLoc(coords);
          setIsLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [gpsTrigger, map, setPos, setGpsLoc]);

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

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Repeatedly invalidate size while the CSS transition (height change) is happening
    const interval = setInterval(() => {
      map.invalidateSize();
    }, 30);
    setTimeout(() => {
      clearInterval(interval);
      map.invalidateSize();
    }, 400); // clear after 300ms transition ends
    
    return () => clearInterval(interval);
  }, [map]);
  return null;
}

export function RoutePickerMap({ onSelectStart, onSelectEnd, centerTo, selectedRoute, autoGps, readonly, onActiveBusesChange }: RoutePickerMapProps) {
  const [center, setCenter] = useState<[number, number]>([37.5665, 126.9780]); // Default: Seoul City Hall
  const [gpsLocation, setGpsLocation] = useState<[number, number] | null>(null);
  const [gpsTrigger, setGpsTrigger] = useState(0);
  
  const [activeBuses, setActiveBuses] = useState<any[]>([]);
  const [displayBuses, setDisplayBuses] = useState<any[]>([]);

  // Try to get user location
  useEffect(() => {
    if (navigator.geolocation && !autoGps) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setGpsLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {}
      );
    }
  }, []);

  // Fetch real-time bus locations
  useEffect(() => {
    if (!selectedRoute || !readonly) return;
    
    const busSteps = selectedRoute.steps.filter(s => s.type === 'BUS' && s.localRouteId && s.cityCode === 6000);
    if (busSteps.length === 0) return;

    let mounted = true;
    const fetchBuses = async () => {
      try {
        const apiKey = import.meta.env.VITE_BUS_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
        const stdgCd = '3100000000';
        const url = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${stdgCd}&numOfRows=1000&pageNo=1&type=json`;
        
        const res = await fetch(url);
        const data = await res.json();
        if (data?.header?.resultCode === 'K0' || data?.header?.resultCode === '00') {
          let allLocations: any[] = [];
          const items = data.body?.items?.item || [];
          allLocations = Array.isArray(items) ? items : [items];
          
          const totalCount = parseInt(data.body?.totalCount || '0', 10);
          if (totalCount > 1000) {
            const totalPages = Math.ceil(totalCount / 1000);
            const promises = [];
            for (let page = 2; page <= totalPages; page++) {
              const nextUrl = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${stdgCd}&numOfRows=1000&pageNo=${page}&type=json`;
              promises.push(fetch(nextUrl).then(r => r.json()));
            }
            const results = await Promise.all(promises);
            results.forEach(res => {
              if (res?.header?.resultCode === 'K0' || res?.header?.resultCode === '00') {
                let pageItems = res.body?.items?.item || [];
                pageItems = Array.isArray(pageItems) ? pageItems : [pageItems];
                allLocations = allLocations.concat(pageItems);
              }
            });
          }
          
          const localRouteIds = busSteps.map(s => String(s.localRouteId).replace(/[^0-9]/g, ''));
          const buses = allLocations.filter((b: any) => localRouteIds.includes(String(b.rteId)));
          
          const validBuses = buses.filter((b: any) => {
            const rteId = String(b.rteId);
            const step = busSteps.find(s => String(s.localRouteId).replace(/[^0-9]/g, '') === rteId);
            if (!step || !step.startY || !step.startX) return true;
            
            const startY = step.startY;
            const startX = step.startX;
            
            const R = 6371; 
            const dLat = (startY - parseFloat(b.lat)) * Math.PI / 180;
            const dLon = (startX - parseFloat(b.lot)) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(parseFloat(b.lat) * Math.PI / 180) * Math.cos(startY * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const dist = R * c;
            
            if (dist < 0.05) return true;
            
            if (b.oprDrct) {
              const toRad = (deg: number) => deg * Math.PI / 180;
              const toDeg = (rad: number) => rad * 180 / Math.PI;
              const dLon2 = toRad(startX - parseFloat(b.lot));
              const y = Math.sin(dLon2) * Math.cos(toRad(startY));
              const x = Math.cos(toRad(parseFloat(b.lat))) * Math.sin(toRad(startY)) - Math.sin(toRad(parseFloat(b.lat))) * Math.cos(toRad(startY)) * Math.cos(dLon2);
              const bearingToStart = (toDeg(Math.atan2(y, x)) + 360) % 360;
              
              const diff = Math.abs(parseFloat(b.oprDrct) - bearingToStart) % 360;
              const angleDiff = diff > 180 ? 360 - diff : diff;
              
              if (angleDiff > 100) return false;
            }
            return true;
          });
          
          if (mounted) {
            // Sort by distance to boarding station and limit to 3 closest
            const busesWithDist = validBuses.map((b: any) => {
              const rteId = String(b.rteId);
              const step = busSteps.find(s => String(s.localRouteId).replace(/[^0-9]/g, '') === rteId);
              let dist = Infinity;
              if (step?.startY && step?.startX) {
                const dy = step.startY - parseFloat(b.lat);
                const dx = step.startX - parseFloat(b.lot);
                dist = dy * dy + dx * dx;
              }
              return { bus: b, dist };
            });
            busesWithDist.sort((a: any, b: any) => a.dist - b.dist);
            const closest = busesWithDist.slice(0, 3);
            
            const newActiveBuses = closest.map((item: any) => {
              const rteId = String(item.bus.rteId);
              const step = busSteps.find(s => String(s.localRouteId).replace(/[^0-9]/g, '') === rteId);
              let distKm = undefined;
              if (item.dist !== Infinity && !Number.isNaN(item.dist)) {
                distKm = Math.sqrt(item.dist) * 111;
              }
              return {
                id: item.bus.vhclNo,
                lat: parseFloat(item.bus.lat),
                lng: parseFloat(item.bus.lot),
                rteId: rteId,
                lineName: step?.lineName || '버스',
                speed: item.bus.oprSpd,
                distKm: distKm,
                lastUpdate: Date.now()
              };
            });
            setActiveBuses(newActiveBuses);
            if (onActiveBusesChange) onActiveBusesChange(newActiveBuses);
          }
        }
      } catch (e) {
        // silently fail
      }
    };

    fetchBuses();
    const interval = setInterval(fetchBuses, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedRoute, readonly]);

  // Interpolation loop for smooth movement
  useEffect(() => {
    if (activeBuses.length === 0) {
      setDisplayBuses([]);
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      setDisplayBuses(prevDisplay => {
        return activeBuses.map(activeBus => {
          // If no speed, or no last update, just stay at current
          if (!activeBus.speed || !activeBus.lastUpdate) {
            return { ...activeBus };
          }
          
          const timeElapsedMs = now - activeBus.lastUpdate;
          const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);
          const distanceToMoveKm = activeBus.speed * timeElapsedHours;
          const distanceToMoveDegrees = distanceToMoveKm / 111; // rough conversion from km to degrees

          // Try to find the step to interpolate along its path
          const step = selectedRoute?.steps.find(s => 
            s.type === 'BUS' && 
            s.localRouteId && 
            String(s.localRouteId).replace(/[^0-9]/g, '') === activeBus.rteId
          );

          let newLat = activeBus.lat;
          let newLng = activeBus.lng;

          // Simple predictive interpolation: move towards the next coordinate on the path, or just move towards destination
          if (step && step.fullPathCoords && step.fullPathCoords.length > 0) {
            // Find closest point on full path to current bus location
            let minBusDist = Infinity;
            let busIdx = 0;
            for (let i = 0; i < step.fullPathCoords.length; i++) {
              const d = Math.pow(step.fullPathCoords[i][0] - activeBus.lat, 2) + Math.pow(step.fullPathCoords[i][1] - activeBus.lng, 2);
              if (d < minBusDist) {
                minBusDist = d;
                busIdx = i;
              }
            }

            // Find closest point on full path to boarding station
            let targetIdx = busIdx; 
            if (step.startY && step.startX) {
               let minStationDist = Infinity;
               for (let i = 0; i < step.fullPathCoords.length; i++) {
                 const d = Math.pow(step.fullPathCoords[i][0] - step.startY, 2) + Math.pow(step.fullPathCoords[i][1] - step.startX, 2);
                 if (d < minStationDist) {
                   minStationDist = d;
                   targetIdx = i;
                 }
               }
            }
            
            // Traverse the polyline from busIdx towards targetIdx until we've moved distanceToMoveDegrees
            let currentLat = activeBus.lat;
            let currentLng = activeBus.lng;
            let remainingDist = distanceToMoveDegrees;
            let currentIdx = busIdx;
            const direction = busIdx < targetIdx ? 1 : -1;

            while (remainingDist > 0 && currentIdx !== targetIdx) {
              const nextIdx = currentIdx + direction;
              const nextPoint = step.fullPathCoords[nextIdx];
              const dy = nextPoint[0] - currentLat;
              const dx = nextPoint[1] - currentLng;
              const segmentDist = Math.sqrt(dy * dy + dx * dx);

              if (segmentDist === 0) {
                currentIdx = nextIdx;
                continue;
              }

              if (remainingDist >= segmentDist) {
                // Move full segment
                currentLat = nextPoint[0];
                currentLng = nextPoint[1];
                remainingDist -= segmentDist;
                currentIdx = nextIdx;
              } else {
                // Move partial segment
                const ratio = remainingDist / segmentDist;
                currentLat += dy * ratio;
                currentLng += dx * ratio;
                remainingDist = 0;
              }
            }
            
            newLat = currentLat;
            newLng = currentLng;
            
          } else if (step && step.startY && step.startX) {
            // Fallback: straight line to station
            const dy = step.startY - activeBus.lat;
            const dx = step.startX - activeBus.lng;
            const distToTarget = Math.sqrt(dy * dy + dx * dx);
            
            if (distToTarget > 0) {
              const ratio = Math.min(1, distanceToMoveDegrees / distToTarget);
              newLat = activeBus.lat + dy * ratio;
              newLng = activeBus.lng + dx * ratio;
            }
          }

          // Anti-rubberbanding (prevent jumping backward)
          const prevBus = prevDisplay.find(p => p.id === activeBus.id);
          if (prevBus && step && step.startY && step.startX) {
             const dyPrev = step.startY - prevBus.lat;
             const dxPrev = step.startX - prevBus.lng;
             const distPrevToTarget = Math.sqrt(dyPrev * dyPrev + dxPrev * dxPrev);

             const dyNew = step.startY - newLat;
             const dxNew = step.startX - newLng;
             const distNewToTarget = Math.sqrt(dyNew * dyNew + dxNew * dxNew);

             // If the new ideal position is further from the target than the previous position 
             // (by more than ~5 meters), it means the bus jumped backward! 
             // So we freeze the bus at its previous position until the ideal position catches up.
             if (distNewToTarget > distPrevToTarget + 0.00005) {
                newLat = prevBus.lat;
                newLng = prevBus.lng;
             }
          }

          return {
            ...activeBus,
            lat: newLat,
            lng: newLng
          };
        });
      });
    }, 100);

    return () => clearInterval(intervalId);
  }, [activeBuses, selectedRoute]);

  // Set initial display buses only if they don't exist in displayBuses yet
  useEffect(() => {
    setDisplayBuses(prev => {
      const updated = [...prev];
      activeBuses.forEach(ab => {
        if (!updated.find(ub => ub.id === ab.id)) {
          updated.push(ab);
        }
      });
      return updated;
    });
  }, [activeBuses]);

  const handleGpsClick = () => {
    setGpsTrigger(prev => prev + 1);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: readonly ? '100%' : '220px', borderRadius: readonly ? '0' : '16px', overflow: 'hidden', border: readonly ? 'none' : '1px solid rgba(255,255,255,0.1)', marginBottom: readonly ? '0' : '16px' }}>
      <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
          attribution='&copy; V-World'
        />
        <MapController setPos={setCenter} setGpsLoc={setGpsLocation} centerTo={centerTo} gpsTrigger={gpsTrigger} selectedRoute={selectedRoute} autoGps={autoGps} />
        <MapResizer />
        
        {gpsLocation && <Marker position={gpsLocation} icon={gpsIcon} />}
        
        {/* Render Entire Bus Routes (Gray Lines) FIRST so they stay behind */}
        <Pane name="gray-paths" style={{ zIndex: 400 }}>
          {selectedRoute && selectedRoute.steps.map(step => {
            if (step.type === 'BUS' && step.fullPathCoords && step.fullPathCoords.length > 0) {
              return (
                <Polyline
                  key={`full-path-${step.id}`}
                  positions={step.fullPathCoords}
                  color="#9ca3af"
                  weight={4}
                  opacity={0.6}
                  lineCap="round"
                  lineJoin="round"
                />
              );
            }
            return null;
          })}
        </Pane>

        {/* Render Route Polylines SECOND so they are on top */}
        <Pane name="colored-paths" style={{ zIndex: 410 }}>
          {selectedRoute && selectedRoute.steps.map(step => {
            if (!step.pathCoords || step.pathCoords.length === 0) return null;
            const isWalk = step.type === 'WALK';
            return (
              <Polyline 
                key={step.id} 
                positions={step.pathCoords} 
                color={isWalk ? '#9ca3af' : (step.lineColor || '#6c5ce7')} 
                weight={isWalk ? 4 : 5} 
                opacity={isWalk ? 0.9 : 1.0} 
                lineCap="round"
                lineJoin="round"
                dashArray={isWalk ? "8, 10" : undefined}
              />
            );
          })}
        </Pane>

        {/* Start/End Pins for Route Summary Map */}
        {readonly && selectedRoute && (() => {
          const startPos = selectedRoute.steps.find(s => s.pathCoords && s.pathCoords.length > 0)?.pathCoords?.[0];
          const endPosList = selectedRoute.steps.filter(s => s.pathCoords && s.pathCoords.length > 0);
          const endPos = endPosList && endPosList.length > 0 ? endPosList[endPosList.length - 1].pathCoords?.slice(-1)[0] : undefined;
          
          return (
            <>
              {startPos && <Marker position={startPos} icon={startIcon} zIndexOffset={500} />}
              {endPos && <Marker position={endPos} icon={endIcon} zIndexOffset={500} />}
            </>
          );
        })()}

        {/* Real-time Bus Markers */}
        {displayBuses.map(bus => (
          <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon} zIndexOffset={1000}>
            <Popup closeButton={false} autoPan={false} className="compact-popup">
              <div style={{ padding: '0', textAlign: 'center', margin: 0, lineHeight: '1.2', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981' }}>{bus.lineName}</span>
                  {bus.speed !== undefined && <span style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }}>{bus.speed}km/h</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
                  {bus.distKm !== undefined && !Number.isNaN(bus.distKm) && bus.distKm !== Infinity ? `${bus.distKm.toFixed(1)}km 남음` : '위치 파악중'}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Center Crosshair / Pin Overlay */}
      {!readonly && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -100%)', zIndex: 1000, pointerEvents: 'none', color: '#ef4444', filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))' }}>
          <MapPin size={32} fill="currentColor" color="white" />
        </div>
      )}

      {/* GPS Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleGpsClick(); }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{ 
          position: 'absolute', bottom: readonly ? '110px' : '64px', right: '12px', zIndex: 1000, 
          background: 'rgba(255,255,255,0.95)', color: '#3b82f6', border: '1px solid rgba(0,0,0,0.1)', 
          borderRadius: '50%', width: '44px', height: '44px', display: 'flex', 
          justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', cursor: 'pointer',
          transition: 'transform 0.1s ease'
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.9)'; }}
        onTouchEnd={(e) => { 
          e.currentTarget.style.transform = 'scale(1)'; 
          e.stopPropagation(); 
          handleGpsClick(); 
        }}
      >
        <Navigation size={22} fill="currentColor" />
      </button>

      {/* Action Buttons */}
      {!readonly && (
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', gap: '8px', zIndex: 1000 }}>
          <button
            onClick={() => onSelectStart(center[0], center[1])}
            style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}
          >
            출발지로 설정
          </button>
          <button
            onClick={() => onSelectEnd(center[0], center[1])}
            style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '8px 0', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', cursor: 'pointer' }}
          >
            도착지로 설정
          </button>
        </div>
      )}
    </div>
  );
}
