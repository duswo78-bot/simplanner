import React, { useEffect, useState } from 'react';
import type { RoutePathStep } from './RouteTypes';
import { Footprints, Bus, Train } from 'lucide-react';
import { getRealtimeBusArrival } from './OdsayApi';

interface RouteTimelineProps {
  steps: RoutePathStep[];
  activeBuses?: any[];
  isRiding?: boolean;
  ridingBusId?: string | null;
  refreshTrigger?: number;
}

function TransitStepDetails({ step, activeBuses, isRiding, ridingBusId, refreshTrigger }: { step: RoutePathStep, activeBuses?: any[], isRiding?: boolean, ridingBusId?: string | null, refreshTrigger?: number }) {
  const [arrivalInfo, setArrivalInfo] = useState<string | null>(null);
  const [hasVibrated, setHasVibrated] = useState(false);

  useEffect(() => {
    if (step.type !== 'BUS') return;

    const rteId = step.localRouteId ? String(step.localRouteId).replace(/[^0-9]/g, '') : '';
    let intervalId: ReturnType<typeof setInterval>;
    let mounted = true;

    // 1. Riding State: show time to destination (alighting station)
    if (isRiding) {
      if (activeBuses && activeBuses.length > 0 && ridingBusId) {
        const ridingBus = activeBuses.find(b => b.id === ridingBusId && b.rteId === rteId);
        if (ridingBus && ridingBus.distKm !== undefined && step.distanceMeters) {
          const stepDistKm = step.distanceMeters / 1000;
          const prog = Math.max(0, Math.min(1, ridingBus.distKm / stepDistKm));
          const remainingMinutes = Math.ceil((1 - prog) * Math.max(1, step.durationMinutes));
          
          if (remainingMinutes <= 0) {
            setArrivalInfo('곧 하차');
          } else {
            setArrivalInfo(`약 ${remainingMinutes}분 후 도착`);
            if (remainingMinutes <= 2 && !hasVibrated) {
              if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
              setHasVibrated(true);
            }
          }
          return;
        }
      }
      
      // If we are riding but no bus is matched yet, show static travel time
      setArrivalInfo(`약 ${step.durationMinutes}분 소요`);
      return;
    }

    // 2. Not Riding (Waiting for bus): Check for close active buses
    if (activeBuses && activeBuses.length > 0) {
      let targetBuses = activeBuses.filter(b => b.rteId === rteId && !b.isPassed);
      if (targetBuses.length > 0) {
        const closest = targetBuses.reduce((prev, curr) => 
          (prev.distKm !== undefined && curr.distKm !== undefined && prev.distKm < curr.distKm) ? prev : curr
        );
        
        if (closest.distKm !== undefined && !Number.isNaN(closest.distKm) && closest.distKm !== Infinity) {
          const speed = (closest.speed && closest.speed > 0) ? closest.speed : 20;
          const hours = closest.distKm / speed;
          const minutes = Math.ceil(hours * 60);
          
          if (minutes === 0 || closest.distKm < 0.1) {
             setArrivalInfo('곧 도착');
          } else {
             setArrivalInfo(`약 ${minutes}분 후`);
          }
          return;
        }
      }
    }

    // 3. Fallback: Poll API for boarding ETA
    if (step.startStationId && step.routeId) {
      let endX: number | undefined = undefined;
      let endY: number | undefined = undefined;
      if (step.pathCoords && step.pathCoords.length > 0) {
        const lastPoint = step.pathCoords[step.pathCoords.length - 1];
        endY = lastPoint[0];
        endX = lastPoint[1];
      }

      const fetchArrivalInfo = () => {
        getRealtimeBusArrival(step.startStationId!, step.routeId!, step.localRouteId, step.cityCode, step.startX, step.startY, endX, endY).then(info => {
          if (mounted && info !== null) {
            if (typeof info === 'number') {
              setArrivalInfo(`약 ${info}분 후`);
            } else {
              setArrivalInfo(info);
            }
          }
        });
      };

      // Initial fetch
      fetchArrivalInfo();
      
      // Poll every 10 seconds
      intervalId = setInterval(fetchArrivalInfo, 10000);
    }

    return () => { 
      mounted = false; 
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, activeBuses, isRiding, ridingBusId, hasVibrated, refreshTrigger]);

  return (
    <div style={{ 
      marginTop: '12px', padding: '12px', borderRadius: '8px', 
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {step.startStation} 승차
          </span>
        </div>
        {!isRiding && arrivalInfo && (
          <span style={{ 
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
            whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {arrivalInfo}
          </span>
        )}
      </div>
      
      {step.stationCount && step.stationCount > 0 && (
        <div style={{ margin: '8px 0 8px 16px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{step.stationCount}개 정류장 이동</span>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', flexShrink: 0 }} />
          <span style={{ color: '#fff', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {step.endStation} 하차
          </span>
        </div>
        {isRiding && arrivalInfo && (
          <span style={{ 
            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
            whiteSpace: 'nowrap', flexShrink: 0
          }}>
            {arrivalInfo}
          </span>
        )}
      </div>
    </div>
  );
}

export function RouteTimeline({ steps, activeBuses, isRiding, ridingBusId, refreshTrigger }: RouteTimelineProps) {
  return (
    <div style={{ padding: '8px 16px', position: 'relative' }}>
      {steps.map((step, idx) => {
        let Icon = Footprints;
        let iconColor = '#9ca3af';
        let bg = 'rgba(255,255,255,0.1)';
        
        if (step.type === 'BUS') {
          Icon = Bus;
          iconColor = '#fff';
          bg = step.lineColor || '#3b82f6';
        } else if (step.type === 'SUBWAY') {
          Icon = Train;
          iconColor = '#fff';
          bg = step.lineColor || '#10b981';
        }

        return (
          <div key={step.id} style={{ display: 'flex', gap: '16px', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
            
            {/* Timeline Node & Line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '50%',
                background: bg, display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 0 0 4px rgba(20, 25, 30, 0.8)',
                zIndex: 2
              }}>
                <Icon size={12} color={iconColor} />
              </div>
              {idx < steps.length - 1 && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  background: bg,
                  opacity: step.type === 'WALK' ? 0.3 : 1,
                  marginTop: '-4px',
                  marginBottom: '-28px',
                  zIndex: 1
                }} />
              )}
            </div>
            
            {/* Step Details */}
            <div style={{ flex: 1, paddingBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                  {step.type === 'WALK' ? '도보 이동' : step.lineName}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  {step.durationMinutes}분
                </div>
              </div>
              
              <div style={{ color: step.type === 'WALK' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {step.instruction}
              </div>
              
              {step.type !== 'WALK' && step.startStation && (
                <TransitStepDetails step={step} activeBuses={activeBuses} isRiding={isRiding} ridingBusId={ridingBusId} refreshTrigger={refreshTrigger} />
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
