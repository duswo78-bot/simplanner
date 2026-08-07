import React, { useState, useEffect, useMemo } from 'react';
import { AppContainer } from '../components/AppContainer';
import { Bus, Search, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { BusRouteCard } from './Bus/BusRouteCard';
import type { BusRoute } from './Bus/BusRouteCard';
import { BusTrackerCard } from './Bus/BusTrackerCard';
import type { BusLocation } from './Bus/BusTrackerCard';
import { BusMapView } from './Bus/BusMapView';
import { RoutingApp } from './RoutingApp';
import { Map } from 'lucide-react';

interface BusAppProps {
  onBack: () => void;
}

const CITY_CODES = [
  { code: '3100000000', name: '울산광역시 (현재 유일하게 서비스 지원됨)' },
  { code: '1100000000', name: '서울특별시 (공공데이터 미개방)' },
  { code: '2600000000', name: '부산광역시 (공공데이터 미개방)' },
  { code: '2700000000', name: '대구광역시 (공공데이터 미개방)' },
  { code: '2800000000', name: '인천광역시 (공공데이터 미개방)' },
  { code: '2900000000', name: '광주광역시 (공공데이터 미개방)' },
  { code: '3000000000', name: '대전광역시 (공공데이터 미개방)' },
  { code: '5000000000', name: '제주특별자치도 (공공데이터 미개방)' },
];

export function BusApp({ onBack }: BusAppProps) {
  const [cityCode, setCityCode] = useState<string>('3100000000'); // Default Ulsan
  const [allRoutes, setAllRoutes] = useState<BusRoute[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
  const [locations, setLocations] = useState<BusLocation[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // App Mode State
  const [activeTab, setActiveTab] = useState<'BUS' | 'ROUTE'>('ROUTE');

  // Load saved city code on mount
  useEffect(() => {
    const savedCityCode = localStorage.getItem('bus_stdg_cd');
    if (savedCityCode) {
      setCityCode(savedCityCode);
    }
  }, []);

  // Fetch routes for city
  useEffect(() => {
    let isMounted = true;
    const fetchRoutes = async () => {
      setIsLoadingRoutes(true);
      setError(null);
      setAllRoutes([]);

      try {
        const apiKey = import.meta.env.VITE_BUS_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
        // API는 numOfRows 최대 1000건까지 허용
        const url = `https://apis.data.go.kr/B551982/rte/mst_info?serviceKey=${apiKey}&stdgCd=${cityCode}&numOfRows=1000&pageNo=1&type=json`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (!isMounted) return;

        if (data?.header?.resultCode === 'K0' || data?.header?.resultCode === '00') {
          const items = data.body?.items?.item || [];
          setAllRoutes(Array.isArray(items) ? items : [items]);
        } else if (data?.header?.resultMsg === 'NODATA_ERROR') {
          setError('해당 지역은 국가 공공데이터망에 아직 실시간 노선 데이터가 연동되지 않았습니다. (현재 울산광역시 등 일부 시범 운영 중)');
        } else {
          setError(`API 오류: ${data?.header?.resultMsg || '알 수 없는 오류'}`);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('노선 데이터를 불러오는 중 통신 오류가 발생했습니다.');
      } finally {
        if (isMounted) setIsLoadingRoutes(false);
      }
    };

    fetchRoutes();
    return () => { isMounted = false; };
  }, [cityCode]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setCityCode(code);
    localStorage.setItem('bus_stdg_cd', code);
    setSearchQuery('');
  };

  const displayedRoutes = useMemo(() => {
    if (!searchQuery.trim()) return allRoutes.slice(0, 50); // Show max 50 default
    return allRoutes.filter(r => (r.rteNo || '').includes(searchQuery.trim())).slice(0, 100);
  }, [allRoutes, searchQuery]);

  const fetchLocations = async (route: BusRoute, silent = false) => {
    if (!silent) setIsRefreshing(true);
    else setIsRefreshing(true);
    
    setError(null);
    
    try {
      const apiKey = import.meta.env.VITE_BUS_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
      // API는 numOfRows 최대 1000건까지 허용
      const url = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${route.stdgCd}&numOfRows=1000&pageNo=1&type=json`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data?.header?.resultCode === 'K0' || data?.header?.resultCode === '00') {
        let allLocations: BusLocation[] = [];
        const items = data.body?.items?.item || [];
        allLocations = Array.isArray(items) ? items : [items];
        
        const totalCount = parseInt(data.body?.totalCount || '0', 10);
        if (totalCount > 1000) {
          const totalPages = Math.ceil(totalCount / 1000);
          const promises = [];
          for (let page = 2; page <= totalPages; page++) {
            const nextUrl = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${route.stdgCd}&numOfRows=1000&pageNo=${page}&type=json`;
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
        
        // Filter buses that belong to this route
        const activeBuses = allLocations.filter((b: BusLocation) => b.rteId === route.rteId);
        setLocations(activeBuses);
      } else {
        setError(`API 오류: ${data?.header?.resultMsg || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error(err);
      setError('실시간 위치 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRouteClick = (route: BusRoute) => {
    setSelectedRoute(route);
    setLocations([]);
    fetchLocations(route);
  };

  return (
    <AppContainer title="대중교통" onBack={onBack}>
      
      {/* Top Tab Bar */}
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '4px', marginBottom: '8px', flexShrink: 0 }}>
        <button 
          onClick={() => setActiveTab('ROUTE')}
          style={{ 
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
            background: activeTab === 'ROUTE' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'ROUTE' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontWeight: activeTab === 'ROUTE' ? 'bold' : 'normal',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer',
            transition: 'all 0.2s', fontSize: '0.9rem'
          }}
        >
          <Map size={16} /> 길찾기
        </button>
        <button 
          onClick={() => setActiveTab('BUS')}
          style={{ 
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
            background: activeTab === 'BUS' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: activeTab === 'BUS' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontWeight: activeTab === 'BUS' ? 'bold' : 'normal',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer',
            transition: 'all 0.2s', fontSize: '0.9rem'
          }}
        >
          <Bus size={16} /> 실시간 버스
        </button>
      </div>

      {activeTab === 'ROUTE' ? (
        <div>
          {/* We reuse RoutingApp UI here but remove its own AppContainer */}
          <RoutingApp onBack={onBack} isEmbedded={true} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          {!selectedRoute ? (
            // Route Search View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="glass-panel" style={{ padding: '8px 12px', borderRadius: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select 
                value={cityCode} 
                onChange={handleCityChange}
                style={{ 
                  flex: 1, padding: '10px 12px', borderRadius: '10px', 
                  background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                  outline: 'none', fontSize: '0.9rem', WebkitAppearance: 'none'
                }}
              >
                {CITY_CODES.map(city => (
                  <option key={city.code} value={city.code} style={{ background: '#1f2937', color: '#fff' }}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ position: 'relative' }}>
              <Search size={18} color="rgba(255,255,255,0.5)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="버스 노선 번호 (예: 101)"
                style={{ 
                  width: '100%', padding: '10px 12px 10px 40px', borderRadius: '10px', 
                  background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                  outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '20px' }}>
            {error && (
              <div style={{ 
                background: error.includes('시범 운영') ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                color: error.includes('시범 운영') ? '#93c5fd' : '#fca5a5', 
                padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                border: `1px solid ${error.includes('시범 운영') ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`, marginBottom: '16px'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{error}</span>
              </div>
            )}

            {isLoadingRoutes && !error && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                지역 노선 데이터를 불러오는 중입니다...
              </div>
            )}

            {!isLoadingRoutes && !error && displayedRoutes.length === 0 && (
              <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
                <Bus size={48} color="rgba(59, 130, 246, 0.5)" style={{ marginBottom: '16px', display: 'inline-block' }} />
                <p style={{ color: 'var(--text-muted)' }}>해당 번호의 노선이 없습니다.</p>
              </div>
            )}

            {!isLoadingRoutes && displayedRoutes.map(route => (
              <BusRouteCard key={route.rteId} route={route} onClick={handleRouteClick} />
            ))}
          </div>
          
        </div>
      ) : (
        // Tracker Info View
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s' }}>
          
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setSelectedRoute(null)}
                style={{ 
                  background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
                  width: '36px', height: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: '#fff', cursor: 'pointer'
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedRoute.rteNo || selectedRoute.rteId}</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedRoute.stpnt} ↔ {selectedRoute.edpnt}</div>
              </div>
            </div>
            
            <button 
              onClick={() => fetchLocations(selectedRoute, true)}
              disabled={isRefreshing}
              style={{ 
                background: 'rgba(16, 185, 129, 0.15)', border: 'none', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center',
                color: '#10b981', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: '20px' }}>
            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', 
                padding: '16px', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px',
                border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px'
              }}>
                <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{error}</span>
              </div>
            )}

            {/* Map View */}
            {!error && locations.length > 0 && (
              <BusMapView locations={locations} />
            )}

            {!isRefreshing && !error && locations.length === 0 && (
              <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
                <Bus size={48} color="rgba(255, 255, 255, 0.2)" style={{ marginBottom: '16px', display: 'inline-block' }} />
                <p style={{ color: 'var(--text-muted)' }}>현재 운행 중인 차량이 없습니다.</p>
              </div>
            )}

            {locations.map((loc, idx) => (
              <BusTrackerCard key={`${loc.vhclNo}-${idx}`} location={loc} />
            ))}
            
            {isRefreshing && locations.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                실시간 위치 추적 중...
              </div>
            )}
          </div>
          
        </div>
      )}
      </div>
      )}
    </AppContainer>
  );
}
