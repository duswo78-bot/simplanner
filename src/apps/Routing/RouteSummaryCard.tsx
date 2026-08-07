import React, { useRef, useEffect } from 'react';
import type { RouteOption } from './RouteTypes';
import { Clock, Coins, Activity, Map } from 'lucide-react';
import { RoutePickerMap } from './RoutePickerMap';

interface RouteSummaryCardProps {
  route: RouteOption;
  onClick: () => void;
  isSelected?: boolean;
  isMapVisible?: boolean;
  onShowMap?: () => void;
}

export function RouteSummaryCard({ route, onClick, isSelected, isMapVisible, onShowMap }: RouteSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isMapVisible && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [isMapVisible]);

  return (
    <div 
      ref={cardRef}
      className={`glass-panel ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        padding: 0,
        borderRadius: '16px',
        cursor: 'pointer',
        marginBottom: '12px',
        border: isSelected ? '1px solid rgba(59, 130, 246, 0.8)' : '1px solid rgba(255, 255, 255, 0.1)',
        background: isMapVisible ? 'transparent' : (isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(20, 25, 30, 0.6)'),
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {isMapVisible && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <RoutePickerMap 
            readonly={true}
            autoGps={true}
            selectedRoute={route}
            onSelectStart={() => {}}
            onSelectEnd={() => {}}
          />
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', pointerEvents: 'none' }}>
        
        {/* Top Section */}
        <div style={{ 
          padding: '16px 16px 12px 16px',
          background: isMapVisible ? 'rgba(20, 25, 30, 0.85)' : 'transparent',
          backdropFilter: isMapVisible ? 'blur(8px)' : 'none',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
          borderBottom: isMapVisible ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          <style>{`
            @keyframes pulse-border {
              0% { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
              50% { border-color: rgba(16, 185, 129, 1); box-shadow: 0 0 8px rgba(16, 185, 129, 0.6); }
              100% { border-color: rgba(16, 185, 129, 0.2); box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
            }
          `}</style>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            
            {/* Left side: Time and Routes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>{route.totalTimeMinutes}</span>
                <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)' }}>분</span>
              </div>
              
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: '2px', scrollbarWidth: 'none' }}>
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
                      whiteSpace: 'nowrap',
                      filter: 'brightness(1.7) contrast(1.2)',
                      flexShrink: 0
                    }}>
                      {s.lineName}
                    </span>
                    {idx < arr.length - 1 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', flexShrink: 0 }}>›</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
            
            {/* Right side: Tags and Map Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, marginLeft: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                {route.tags.filter(t => t !== '최적').map(tag => {
                  let bg = 'rgba(255,255,255,0.1)';
                  let color = '#ccc';
                  if (tag === '전철') { bg = 'rgba(168, 85, 247, 0.15)'; color = '#c084fc'; }
                  else if (tag === '버스') { bg = 'rgba(59, 130, 246, 0.15)'; color = '#60a5fa'; }
                  else if (tag === '버스+전철') { bg = 'rgba(245, 158, 11, 0.15)'; color = '#fbbf24'; }

                  return (
                    <span key={tag} style={{
                      background: bg, color: color,
                      padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold',
                      whiteSpace: 'nowrap'
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
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', height: '32px',
                    boxShadow: isMapVisible ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                >
                  <Map size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Spacer to push map open */}
        <div style={{
          transition: 'height 0.3s ease',
          height: isMapVisible ? '240px' : '0px',
          width: '100%'
        }} />

        {/* Bottom Section */}
        <div style={{ 
          padding: '12px 16px 16px 16px',
          background: isMapVisible ? 'rgba(20, 25, 30, 0.85)' : 'transparent',
          backdropFilter: isMapVisible ? 'blur(8px)' : 'none',
          transition: 'all 0.3s ease',
          pointerEvents: 'auto',
          borderTop: isMapVisible ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          {/* Bottom Info: Fare and Transfers */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Coins size={14} color="#8b5cf6" />
                <span style={{ fontWeight: isMapVisible ? 'bold' : 'normal' }}>{route.totalFare.toLocaleString()}원</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} color="#3b82f6" />
                <span style={{ fontWeight: isMapVisible ? 'bold' : 'normal' }}>환승 {route.transferCount}회</span>
              </div>
            </div>
            
            {route.tags.includes('최적') && (
              <span style={{
                color: '#10b981',
                padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                animation: 'pulse-border 1.5s infinite',
                whiteSpace: 'nowrap'
              }}>
                최적
              </span>
            )}
          </div>
          
          {/* Mini graphical route overview */}
          <div style={{ display: 'flex', gap: '4px', height: '6px', borderRadius: '3px', overflow: 'hidden', filter: 'brightness(1.3)' }}>
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
        
      </div> {/* End of relative zIndex 10 container */}
    </div>
  );
}
