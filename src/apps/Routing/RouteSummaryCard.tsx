import React from 'react';
import type { RouteOption } from './RouteTypes';
import { Clock, Coins, Activity, Map } from 'lucide-react';

interface RouteSummaryCardProps {
  route: RouteOption;
  onClick: () => void;
  isSelected?: boolean;
  onShowMap?: () => void;
}

export function RouteSummaryCard({ route, onClick, isSelected, onShowMap }: RouteSummaryCardProps) {
  return (
    <div 
      className={`glass-panel ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        marginBottom: '12px',
        border: isSelected ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
        background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 25, 30, 0.6)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{route.totalTimeMinutes}</span>
          <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>분</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {route.tags.map(tag => (
              <span key={tag} style={{
                background: tag === '최적' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)',
                color: tag === '최적' ? '#10b981' : '#ccc',
                padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {tag}
              </span>
            ))}
          </div>
          {isSelected && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShowMap?.(); }}
              style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', padding: '6px', color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
            >
              <Map size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Coins size={14} />
          {route.totalFare.toLocaleString()}원
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Activity size={14} />
          환승 {route.transferCount}회
        </div>
      </div>
      
      {/* Mini graphical route overview */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
        {route.steps.map((step, idx) => {
          let bg = '#6b7280';
          if (step.type === 'BUS') bg = step.lineColor || '#3b82f6';
          if (step.type === 'SUBWAY') bg = step.lineColor || '#10b981';
          return (
            <div key={idx} style={{ 
              flex: Math.max(1, step.durationMinutes), 
              background: step.type === 'WALK' ? 'repeating-linear-gradient(45deg, #4b5563, #4b5563 2px, transparent 2px, transparent 4px)' : bg 
            }} />
          );
        })}
      </div>
    </div>
  );
}
