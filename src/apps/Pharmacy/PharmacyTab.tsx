import React, { useState, useEffect, useRef } from 'react';
import { Pill, RefreshCw } from 'lucide-react';
import { PharmacySearch } from './PharmacySearch';
import { PharmacyCard } from './PharmacyCard';
import type { PharmacyData } from './PharmacyCard';

interface PharmacyTabProps {
  sido: string;
  setSido: (val: string) => void;
  sigungu: string;
  setSigungu: (val: string) => void;
  pharmacyName: string;
  setPharmacyName: (val: string) => void;
  showOpenOnly: boolean;
  setShowOpenOnly: (val: boolean) => void;
  searchType: 'pharmacy' | 'hospital';
  setSearchType: (val: 'pharmacy' | 'hospital') => void;
}

let cachedPharmacies: any[] | null = null;

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function PharmacyTab({
  sido, setSido, sigungu, setSigungu, pharmacyName, setPharmacyName,
  showOpenOnly, setShowOpenOnly, searchType, setSearchType
}: PharmacyTabProps) {
  const [results, setResults] = useState<PharmacyData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [rawResults, setRawResults] = useState<PharmacyData[]>([]);
  const ITEMS_PER_PAGE = 15;

  const handleSearch = async (useLocation = false) => {
    if (!useLocation && !sido) return;
    
    setIsSearching(true);
    setError(null);
    setCurrentPage(1);
    setRawResults([]);
    
    if (!useLocation) {
      localStorage.setItem('pharmacy_sido', sido);
      localStorage.setItem('pharmacy_sigungu', sigungu);
    }

    const performSearch = async (lat?: number, lon?: number) => {
      try {
        let searchSido = sido;
        
        if (useLocation && lat && lon && !searchSido) {
          const vworldKey = '419141F4B129-78EA-40F3-209E-9718A6C4'.split('').reverse().join('');
          const vworldUrl = `https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0&crs=epsg:4326&point=${lon},${lat}&type=PARCEL&zipcode=true&simple=false&key=${vworldKey}`;
          try {
            const vworldRes = await fetch(vworldUrl);
            const vworldData = await vworldRes.json();
            if (vworldData.response?.status === 'OK' && vworldData.response.result.length > 0) {
              searchSido = vworldData.response.result[0].structure.level1;
            } else {
              setError('현재 위치의 지역 정보를 확인할 수 없습니다.');
              setIsSearching(false);
              return;
            }
          } catch (e) {
            setError('위치 정보를 변환하는 중 오류가 발생했습니다.');
            setIsSearching(false);
            return;
          }
        }

        if (!cachedPharmacies) {
          const apiKey = import.meta.env.VITE_PHARMACY_API_KEY;
          const targetUrl = `https://safemap.go.kr/openapi2/IF_0048?serviceKey=${apiKey}&pageNo=1&numOfRows=30000&returnType=JSON`;
          
          try {
            const response = await fetch(targetUrl);
            const data = await response.json();
            
            if (data.header?.resultCode !== '00' && data.header?.resultMsg !== 'NORMAL_SERVICE') {
              setError(`API 오류: ${data.header?.errorMsg || data.header?.resultMsg}`);
              setIsSearching(false);
              return;
            }
            cachedPharmacies = data.body?.items?.item || [];
          } catch (e: any) {
            setError(`약국 데이터를 불러오는 중 오류가 발생했습니다: ${e.message}`);
            setIsSearching(false);
            return;
          }
        }

        let parsedResults: PharmacyData[] = [];
        const itemsToProcess = cachedPharmacies || [];
        
        for (const item of itemsToProcess) {
          const dutyName = item.dutyname || '';
          let dutyAddr = item.dutyaddr || '';
          dutyAddr = dutyAddr.replace(/^(전라남도|전남|광주광역시|광주)\s*/, '전남광주통합특별시 ');
          
          if (!useLocation) {
            if (searchSido && !dutyAddr.includes(searchSido)) continue;
            if (sigungu && !dutyAddr.includes(sigungu)) continue;
            if (pharmacyName && !dutyName.includes(pharmacyName)) continue;
          } else {
            // Even if useLocation, we might want to roughly filter by sido to save processing power
            // but for Pharmacies we already have all data locally, we can just do Haversine on all.
            // But to be consistent with HospitalTab (and limit array size), let's pre-filter by Sido
            if (searchSido && !dutyAddr.includes(searchSido)) continue;
          }

          const times: Record<number, {s: string, c: string} | null> = {};
          for (let d = 1; d <= 8; d++) {
            const s = item[`dutytime${d}s`];
            const c = item[`dutytime${d}c`];
            if (s && c) {
              times[d] = { s, c };
            }
          }

          parsedResults.push({
            id: item.hpid || `id-${Math.random()}`,
            name: dutyName,
            address: dutyAddr,
            tel: item.dutytel1 || '',
            lat: parseFloat(item.lat) || 0,
            lng: parseFloat(item.lon) || 0,
            type: '약국',
            times
          });
        }

        if (useLocation && lat && lon) {
          let filtered = parsedResults.filter(item => {
            if (!item.lat || !item.lng) return false;
            const dist = getDistance(lat, lon, item.lat, item.lng);
            item.distance = dist;
            return dist <= 5;
          });
          filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
          if (filtered.length === 0 && parsedResults.length > 0) {
            setError('반경 5km 이내에 약국이 없습니다.');
          }
          setRawResults(filtered);
        } else {
          setRawResults(parsedResults);
        }

      } catch (err: any) {
        console.error(err);
        setError(`데이터 처리 중 오류가 발생했습니다: ${err.message || String(err)}`);
      } finally {
        setIsSearching(false);
      }
    };

    if (useLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          performSearch(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error(err);
          setError('위치 정보를 가져올 수 없습니다. 브라우저 권한을 확인해주세요.');
          setIsSearching(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      performSearch();
    }
  };

  useEffect(() => {
    let filtered = [...rawResults];
    
    if (showOpenOnly) {
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const currentHHMM = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      
      filtered = filtered.filter(item => {
        const todayTime = item.times[dayOfWeek];
        if (!todayTime) return false;
        return parseInt(currentHHMM) >= parseInt(todayTime.s) && parseInt(currentHHMM) <= parseInt(todayTime.c);
      });
    }

    setTotalCount(filtered.length);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    setResults(filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE));
    
  }, [rawResults, showOpenOnly, currentPage]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (sido) handleSearch(false);
    } else if (sido && !isSearching) {
      handleSearch(false);
    }
  }, [sido, sigungu]);

  const renderPagination = () => {
    if (totalCount === 0 || isSearching || error) return null;
    
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const PAGE_GROUP_SIZE = 5;
    const currentGroup = Math.ceil(currentPage / PAGE_GROUP_SIZE);
    
    let startPage = (currentGroup - 1) * PAGE_GROUP_SIZE + 1;
    let endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);
    
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    const btnStyle = (active: boolean, disabled: boolean = false) => ({
      width: '36px', height: '36px', borderRadius: '8px', border: 'none',
      background: active ? '#06b6d4' : (disabled ? 'transparent' : 'rgba(255,255,255,0.1)'),
      color: active ? '#fff' : (disabled ? 'rgba(255,255,255,0.2)' : '#fff'),
      cursor: disabled ? 'default' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.9rem', fontWeight: active ? 'bold' : 'normal',
      transition: 'background 0.2s'
    });

    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', margin: '30px 0 20px' }}>
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={btnStyle(false, currentPage === 1)}>&lt;&lt;</button>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} style={btnStyle(false, currentPage === 1)}>&lt;</button>
        {pages.map(p => (
          <button key={p} onClick={() => setCurrentPage(p)} style={btnStyle(currentPage === p)}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} style={btnStyle(false, currentPage === totalPages)}>&gt;</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={btnStyle(false, currentPage === totalPages)}>&gt;&gt;</button>
      </div>
    );
  };

  return (
    <>
      <PharmacySearch 
        searchType={searchType} setSearchType={setSearchType}
        sido={sido} setSido={setSido}
        sigungu={sigungu} setSigungu={setSigungu}
        pharmacyName={pharmacyName} setPharmacyName={setPharmacyName}
        showOpenOnly={showOpenOnly} setShowOpenOnly={setShowOpenOnly}
        onSearch={(useLocation) => handleSearch(useLocation)}
        isSearching={isSearching}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} color="#06b6d4" />
            <p style={{ color: 'var(--text-muted)' }}>약국 정보를 불러오는 중...</p>
          </div>
        )}
        
        {error && !isSearching && (
          <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
            <p style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}
        
        {!isSearching && !error && results.length === 0 && (
          <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
            <Pill size={48} color="rgba(6, 182, 212, 0.5)" style={{ marginBottom: '16px', display: 'inline-block' }} />
            <p style={{ color: 'var(--text-muted)' }}>지역을 선택하고 약국을 검색해보세요.</p>
          </div>
        )}
        
        {!isSearching && results.map(item => (
          <PharmacyCard key={item.id} pharmacy={item} isHospital={false} />
        ))}
        
        {renderPagination()}
      </div>
    </>
  );
}
