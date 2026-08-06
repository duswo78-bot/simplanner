import React from 'react';
import type { RouteOption } from './RouteTypes';
import { Clock, Coins, Activity, Map } from 'lucide-react';

interface RouteSummaryCardProps {
  route: RouteOption;
  onClick: () => void;
  isSelected?: boolean;
  isMapVisible?: boolean;
  onShowMap?: () => void;
}

export function RouteSummaryCard({ route, onClick, isSelected, isMapVisible, onShowMap }: RouteSummaryCardProps) {
  return (
    <div 
      className={`glass-panel ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '16px',
        cursor: 'pointer',
        border: isMapVisible ? 'none' : (isSelected ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)'),
        background: isMapVisible ? 'rgba(0,0,0,0.3)' : (isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 25, 30, 0.6)'),
        backdropFilter: isMapVisible ? 'none' : 'blur(12px)',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{route.totalTimeMinutes}</span>
            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>분</span>
          </div>
          
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
            {route.steps.filter(s => s.type !== 'WALK').map((s, idx, arr) => (
              <React.Fragment key={idx}>
                <span style={{
                  color: s.lineColor || '#fff',
                  border: `1px solid ${s.lineColor ? s.lineColor + '80' : 'rgba(255,255,255,0.2)'}`,
                  background: s.lineColor ? s.lineColor + '15' : 'rgba(255,255,255,0.05)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  {s.lineName}
                </span>
                {idx < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>›</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {route.tags.map(tag => {
              let bg = 'rgba(255,255,255,0.1)';
              let color = '#ccc';
              if (tag === '최적') { bg = 'rgba(16, 185, 129, 0.2)'; color = '#10b981'; }
              else if (tag === '지하철') { bg = 'rgba(168, 85, 247, 0.15)'; color = '#c084fc'; }
              else if (tag === '버스') { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
              else if (tag === '버스+지하철') { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; }

              return (
                <span key={tag} style={{
                  background: bg, color: color,
                  padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold'
                }}>
                  {tag}
                </span>
              );
            })}
          </div>
          {isSelected && (
            <button 
              onClick={(e) => { e.stopPropagation(); onShowMap?.(); }}
              style={{
                background: isMapVisible ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255,255,255,0.15)',
                border: isMapVisible ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px', padding: '4px 8px', 
                color: isMapVisible ? '#fff' : 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', height: '24px',
                boxShadow: isMapVisible ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <Map size={14} />
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
