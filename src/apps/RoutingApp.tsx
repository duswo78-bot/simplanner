import React, { useState } from 'react';
import { AppContainer } from '../components/AppContainer';
import { RouteSummaryCard } from './Routing/RouteSummaryCard';
import { RouteTimeline } from './Routing/RouteTimeline';
import type { RouteOption } from './Routing/RouteTypes';
import { searchTransitRoute } from './Routing/OdsayApi';
import type { POI } from './Routing/OdsayApi';
import { StationSearchInput } from './Routing/StationSearchInput';
import { RoutePickerMap } from './Routing/RoutePickerMap';
import { MapPin, Search, ArrowDownUp, Loader2, X, Clock, Minus, Plus, ArrowRight } from 'lucide-react';
import { reverseGeocode } from './Routing/VworldApi';

interface RoutingAppProps {
  onBack: () => void;
  isEmbedded?: boolean;
}

export function RoutingApp({ onBack, isEmbedded = false }: RoutingAppProps) {
  const [startPoi, setStartPoi] = useState<POI | null>(null);
  const [endPoi, setEndPoi] = useState<POI | null>(null);
  
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);
  const [isMapForcedVisible, setIsMapForcedVisible] = useState(false);
  
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);

  const [recentStations, setRecentStations] = useState<POI[]>([]);

  React.useEffect(() => {
    const loadRecents = () => {
      try {
        const recentStr = localStorage.getItem('recent_stations');
        if (recentStr) setRecentStations(JSON.parse(recentStr));
      } catch (e) {}
    };
    loadRecents();
    window.addEventListener('recent_stations_updated', loadRecents);
    return () => window.removeEventListener('recent_stations_updated', loadRecents);
  }, []);

  const removeRecent = (poiName: string) => {
    const newRecents = recentStations.filter(p => p.name !== poiName);
    setRecentStations(newRecents);
    localStorage.setItem('recent_stations', JSON.stringify(newRecents));
  };

  const handleRecentClick = (poi: POI) => {
    if (!startPoi) {
      setStartPoi(poi);
      setMapCenter([poi.y, poi.x]);
    } else {
      setEndPoi(poi);
      setMapCenter([poi.y, poi.x]);
    }
  };

  const handleSearch = async () => {
    setIsSearched(true);
    if (!startPoi || !endPoi) {
      setErrorMsg('출발지와 도착지를 모두 선택해주세요.');
      return;
    }
    
    setIsLoading(true);
    setErrorMsg('');
    setRoutes([]);
    
    try {
      // 1. Get Routes directly with POIs
      const foundRoutes = await searchTransitRoute(startPoi, endPoi);
      setRoutes(foundRoutes);
      
      if (foundRoutes.length > 0) {
        setSelectedRouteId(foundRoutes[0].id);
        setIsSearchCollapsed(true);
        setIsMapForcedVisible(false);
      } else {
        setErrorMsg('경로를 찾을 수 없습니다.');
      }
      
    } catch (err: any) {
      if (err.message?.includes('ApiKeyAuthFailed')) {
        setErrorMsg('API 키 인증 실패: ODsay 콘솔에서 http://localhost:5173 도메인을 등록해 주세요.');
      } else {
        setErrorMsg(err.message || '경로 탐색 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = () => {
    const temp = startPoi;
    setStartPoi(endPoi);
    setEndPoi(temp);
  };

  const selectedRoute = routes.find(r => r.id === selectedRouteId);

  const content = (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Search Panel */}
        <div className="glass-panel" style={{ position: 'relative', zIndex: 50, padding: '8px 12px', borderRadius: '12px', marginBottom: '8px', flexShrink: 0 }}>
          {isSearchCollapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, padding: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{startPoi?.name}</span>
                <ArrowRight size={16} color="rgba(255,255,255,0.4)" />
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold' }}>{endPoi?.name}</span>
              </div>
              <button onClick={() => { setIsSearchCollapsed(false); }} style={{ 
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: '#fff', cursor: 'pointer'
              }}>
                <Plus size={16} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 'bold', marginLeft: '4px' }}>경로 검색</span>
                {startPoi && endPoi && (
                  <button onClick={() => setIsSearchCollapsed(true)} style={{ 
                    background: 'transparent', border: 'none', padding: '4px',
                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex'
                  }}>
                    <Minus size={18} />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Timeline graphics */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', width: '20px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #3b82f6', background: '#1f2937' }} />
                  <div style={{ width: '2px', height: '32px', background: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                </div>

                {/* Inputs */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ position: 'relative', zIndex: 20 }}>
                    <StationSearchInput 
                      placeholder="출발지 (예: 서울역)"
                      value={startPoi}
                      onSelect={(poi) => { setStartPoi(poi); setMapCenter([poi.y, poi.x]); }}
                      iconColor="#3b82f6"
                    />
                  </div>
                  <div style={{ position: 'relative', zIndex: 10 }}>
                    <StationSearchInput 
                      placeholder="도착지 (예: 강남역)"
                      value={endPoi}
                      onSelect={(poi) => { setEndPoi(poi); setMapCenter([poi.y, poi.x]); }}
                      iconColor="#ef4444"
                    />
                  </div>
                </div>
                
                {/* Swap Button */}
                <button onClick={handleSwap} style={{ 
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: '#fff', cursor: 'pointer', flexShrink: 0
                }}>
                  <ArrowDownUp size={20} />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Recent Stations */}
        {recentStations.length > 0 && (
          <div style={{ marginBottom: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
              <Clock size={12} />
              <span>자주 찾는 정류장</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
              {recentStations.map((poi, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'rgba(255,255,255,0.1)', padding: '4px 10px',
                  borderRadius: '16px', whiteSpace: 'nowrap', fontSize: '0.75rem'
                }}>
                  <span style={{ cursor: 'pointer', color: '#fff' }} onClick={() => handleRecentClick(poi)}>
                    {poi.name}
                  </span>
                  <X 
                    size={12} 
                    color="rgba(255,255,255,0.4)" 
                    style={{ cursor: 'pointer', marginLeft: '4px' }} 
                    onClick={(e) => { e.stopPropagation(); removeRecent(poi.name); }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Route Picker Map & Search Button */}
        {!isSearchCollapsed && (
          <div style={{ flexShrink: 0, position: 'relative', zIndex: 1, marginBottom: '12px' }}>
            <RoutePickerMap 
              centerTo={mapCenter}
              selectedRoute={selectedRoute}
              onSelectStart={async (lat, lng) => {
                const name = await reverseGeocode(lat, lng);
                setStartPoi({ id: Date.now(), name, x: lng, y: lat });
              }}
              onSelectEnd={async (lat, lng) => {
                const name = await reverseGeocode(lat, lng);
                setEndPoi({ id: Date.now()+1, name, x: lng, y: lat });
              }}
            />
          </div>
        )}

        {!isSearchCollapsed && (
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            style={{
              flexShrink: 0,
              width: '100%', padding: '14px', borderRadius: '16px',
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
              color: '#fff', fontWeight: 'bold', fontSize: '1rem',
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', marginBottom: '16px',
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />} 
            {isLoading ? '경로 탐색 중...' : '경로 탐색'}
          </button>
        )}

        {/* Results Area */}
        {isSearched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 className="animate-spin" size={32} color="#fff" style={{ marginBottom: '16px' }} />
                <p style={{ color: '#fff', fontSize: '1.1rem' }}>최적의 경로를 탐색중입니다...</p>
              </div>
            ) : errorMsg ? (
              <div style={{ 
                background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
                padding: '16px', borderRadius: '12px', color: '#fca5a5', textAlign: 'center' 
              }}>
                {errorMsg}
              </div>
            ) : routes.length > 0 ? (
              <>
                {routes.map(route => {
                  const isSelected = selectedRouteId === route.id;
                  const isMapVisible = isSelected && isMapForcedVisible;
                  
                  return (
                  <div key={route.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '16px', marginBottom: '12px', border: isMapVisible ? '1px solid rgba(59, 130, 246, 0.8)' : 'none' }}>
                    {isMapVisible && (
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
                        <RoutePickerMap 
                          readonly={true}
                          autoGps={true}
                          selectedRoute={route}
                          onSelectStart={() => {}}
                          onSelectEnd={() => {}}
                        />
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.95) 100%)', zIndex: 1 }} />
                      </div>
                    )}
                    <div style={{ position: 'relative', zIndex: 10 }}>
                      <RouteSummaryCard 
                        route={route} 
                        isSelected={isSelected}
                        isMapVisible={isMapVisible}
                        onClick={() => { setSelectedRouteId(route.id); if (selectedRouteId !== route.id) setIsMapForcedVisible(false); }}
                        onShowMap={() => setIsMapForcedVisible(!isMapForcedVisible)}
                      />
                      {isSelected && (
                        <div style={{ 
                          marginTop: isMapVisible ? '0' : '-8px', paddingTop: '16px', paddingBottom: '16px',
                          background: isMapVisible ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)', 
                          borderRadius: '0 0 16px 16px',
                          border: isMapVisible ? 'none' : '1px solid rgba(255,255,255,0.05)', 
                          borderTop: 'none', backdropFilter: isMapVisible ? 'none' : 'blur(12px)'
                        }}>
                          <RouteTimeline steps={route.steps} />
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </>
            ) : null}
          </div>
        )}
      </div>
  );

  return isEmbedded ? content : (
    <AppContainer title="대중교통 길찾기" onBack={onBack}>
      {content}
    </AppContainer>
  );
}
