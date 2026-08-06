import React from 'react';
import { Bus, Navigation } from 'lucide-react';

export interface BusLocation {
  stdgCd: string;
  lclgvNm: string;
  rteId: string;
  vhclNo: string;
  gthrDt: string;
  lat: string;
  lot: string;
  oprSpd: string;
}

interface BusTrackerCardProps {
  location: BusLocation;
}

export function BusTrackerCard({ location }: BusTrackerCardProps) {
  const speed = parseInt(location.oprSpd, 10) || 0;
  const isMoving = speed > 0;
  
  // Format the time (e.g. 2026-08-05 21:15:51.869477 -> 21:15:51)
  const timeMatch = location.gthrDt.match(/(\d{2}:\d{2}:\d{2})/);
  const timeStr = timeMatch ? timeMatch[1] : location.gthrDt;

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '16px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(20, 25, 30, 0.6)',
        marginBottom: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: isMoving ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.1)', 
        color: isMoving ? '#10b981' : 'var(--text-muted)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0
      }}>
        <Bus size={24} className={isMoving ? "animate-pulse" : ""} />
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>
            {location.vhclNo}
          </h3>
          <span style={{ 
            fontSize: '0.75rem', fontWeight: 'bold', 
            color: isMoving ? '#10b981' : 'var(--text-muted)',
            border: `1px solid ${isMoving ? '#10b981' : 'var(--text-muted)'}`, 
            borderRadius: '4px', padding: '2px 6px'
          }}>
            {isMoving ? '주행중' : '정차/대기'}
          </span>
        </div>
        
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Navigation size={12} />
          {isMoving ? `현재 속도: ${speed} km/h` : '차량이 정지해 있습니다.'}
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          업데이트
        </div>
        <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
          {timeStr}
        </div>
      </div>
    </div>
  );
}
