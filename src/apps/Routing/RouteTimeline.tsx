import React, { useEffect, useState } from 'react';
import type { RoutePathStep } from './RouteTypes';
import { Footprints, Bus, Train } from 'lucide-react';
import { getRealtimeBusArrival } from './OdsayApi';

interface RouteTimelineProps {
  steps: RoutePathStep[];
  activeBuses?: any[];
}

function TransitStepDetails({ step, activeBuses }: { step: RoutePathStep, activeBuses?: any[] }) {
  const [arrivalInfo, setArrivalInfo] = useState<number | string | null>(null);

  useEffect(() => {
    if (step.type === 'BUS' && activeBuses && activeBuses.length > 0) {
      const rteId = step.localRouteId ? String(step.localRouteId).replace(/[^0-9]/g, '') : '';
      const busesForRoute = activeBuses.filter(b => b.rteId === rteId);
      if (busesForRoute.length > 0) {
        // Find closest bus
        const closest = busesForRoute.reduce((prev, curr) => 
          (prev.distKm !== undefined && curr.distKm !== undefined && prev.distKm < curr.distKm) ? prev : curr
        );
        
        if (closest.distKm !== undefined && !Number.isNaN(closest.distKm) && closest.distKm !== Infinity) {
          // Assume ~20km/h average speed in city if we don't use real speed, but let's use actual speed or 20
          const speed = (closest.speed && closest.speed > 0) ? closest.speed : 20;
          const hours = closest.distKm / speed;
          const minutes = Math.ceil(hours * 60);
          if (minutes === 0 || closest.distKm < 0.1) {
             setArrivalInfo('곧 도착');
          } else {
             setArrivalInfo(`약 ${minutes}분 후 도착 (${closest.distKm.toFixed(1)}km)`);
          }
          return;
        }
      }
    }
    
    // Fallback if no active buses or not a bus
    let mounted = true;
    if (step.type === 'BUS' && step.startStationId && step.routeId) {
      let endX = undefined;
      let endY = undefined;
      if (step.pathCoords && step.pathCoords.length > 0) {
        const lastPoint = step.pathCoords[step.pathCoords.length - 1];
        endY = lastPoint[0];
        endX = lastPoint[1];
      }
      getRealtimeBusArrival(step.startStationId, step.routeId, step.localRouteId, step.cityCode, step.startX, step.startY, endX, endY).then(info => {
        if (mounted && info !== null) {
          if (typeof info === 'number') {
            setArrivalInfo(`약 ${info}분 후 도착`);
          } else {
            setArrivalInfo(info);
          }
        }
      });
    }
    return () => { mounted = false; };
  }, [step, activeBuses]);

  return (
    <div style={{ 
      marginTop: '12px', padding: '12px', borderRadius: '8px', 
      background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #fff' }} />
          <span style={{ color: '#fff', fontSize: '0.9rem' }}>{step.startStation} 승차</span>
        </div>
        {arrivalInfo !== null && (
          <span style={{ 
            color: typeof arrivalInfo === 'string' && arrivalInfo.includes('도착') ? '#ef4444' : '#9ca3af', 
            fontSize: '0.85rem', fontWeight: 'bold', 
            background: typeof arrivalInfo === 'string' && arrivalInfo.includes('도착') ? 'rgba(239,68,68,0.15)' : 'rgba(156,163,175,0.15)', 
            padding: '2px 6px', borderRadius: '4px' 
          }}>
            {arrivalInfo}
          </span>
        )}
      </div>
      
      {step.stationCount && (
        <div style={{ paddingLeft: '11px', borderLeft: '2px dotted rgba(255,255,255,0.2)', margin: '4px 0', height: '20px', display: 'flex', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', paddingLeft: '12px' }}>
            {step.stationCount}개 정류장 이동
          </span>
        </div>
      )}
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
        <span style={{ color: '#fff', fontSize: '0.9rem' }}>{step.endStation} 하차</span>
      </div>
    </div>
  );
}

export function RouteTimeline({ steps, activeBuses }: RouteTimelineProps) {
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
                <TransitStepDetails step={step} activeBuses={activeBuses} />
              )}
            </div>
            
          </div>
        );
      })}
    </div>
  );
}
