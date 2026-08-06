import React from 'react';
import { Route, MapPin } from 'lucide-react';

export interface BusRoute {
  stdgCd: string;
  lclgvNm: string;
  rteId: string;
  rteNo: string;
  rteType: string;
  stpnt: string;
  edpnt: string;
  vhclFstTm: string;
  vhclLstTm: string;
}

interface BusRouteCardProps {
  route: BusRoute;
  onClick: (route: BusRoute) => void;
}

const formatTime = (timeStr: string) => {
  if (!timeStr || timeStr.length !== 4) return timeStr;
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
};

export function BusRouteCard({ route, onClick }: BusRouteCardProps) {
  let color = '#3b82f6';
  let bg = 'rgba(59, 130, 246, 0.15)';
  
  const typeStr = route.rteType || '';
  if (typeStr.includes('급행') || typeStr.includes('광역') || typeStr.includes('직행')) {
    color = '#ef4444';
    bg = 'rgba(239, 68, 68, 0.15)';
  } else if (typeStr.includes('간선') || typeStr.includes('좌석')) {
    color = '#3b82f6';
    bg = 'rgba(59, 130, 246, 0.15)';
  } else if (typeStr.includes('지선') || typeStr.includes('마을')) {
    color = '#10b981';
    bg = 'rgba(16, 185, 129, 0.15)';
  }

  return (
    <div 
      className="glass-panel" 
      onClick={() => onClick(route)}
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'rgba(20, 25, 30, 0.6)',
        transition: 'all 0.2s ease-in-out',
        marginBottom: '12px',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(20, 25, 30, 0.6)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: bg, color: color,
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        flexShrink: 0
      }}>
        <Route size={24} />
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>
            {route.rteNo || route.rteId}
          </h3>
          {typeStr && (
            <span style={{ 
              fontSize: '0.75rem', fontWeight: 'bold', color: color,
              background: bg, borderRadius: '4px', padding: '2px 6px'
            }}>
              {typeStr}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
          <MapPin size={12} />
          <span>{route.stpnt} ↔ {route.edpnt}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div>첫차 {formatTime(route.vhclFstTm)}</div>
        <div>막차 {formatTime(route.vhclLstTm)}</div>
      </div>
    </div>
  );
}
