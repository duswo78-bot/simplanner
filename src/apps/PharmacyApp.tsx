import React, { useState, useEffect, useRef } from 'react';
import { AppContainer } from '../components/AppContainer';
import { Pill, RefreshCw } from 'lucide-react';
import { PharmacySearch } from './Pharmacy/PharmacySearch';
import { PharmacyCard } from './Pharmacy/PharmacyCard';
import type { PharmacyData } from './Pharmacy/PharmacyCard';

interface PharmacyAppProps {
  onBack: () => void;
}

let cachedPharmacies: any[] | null = null;

export function PharmacyApp({ onBack }: PharmacyAppProps) {
  const [searchType, setSearchType] = useState<'pharmacy' | 'hospital'>('pharmacy');
  const [sido, setSido] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  
  const [results, setResults] = useState<PharmacyData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLocationMode, setIsLocationMode] = useState(false);
  const [lastCoords, setLastCoords] = useState<{lat: number, lon: number} | null>(null);
  const [hospitalTypes, setHospitalTypes] = useState<string[]>([]); // Array for multiple selection
  const [showOpenOnly, setShowOpenOnly] = useState(true); // Open now filtering
  const [rawResults, setRawResults] = useState<PharmacyData[]>([]);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    // Load last searched region
    const savedSido = localStorage.getItem('pharmacy_sido');
    const savedSigungu = localStorage.getItem('pharmacy_sigungu');
    if (savedSido) setSido(savedSido);
    if (savedSigungu) setSigungu(savedSigungu);
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If we loaded a saved Sido on mount, auto-search it
      if (sido) {
        handleSearch(false);
      }
      return;
    }
  }, []);

  useEffect(() => {
    if (sido) {
      handleSearch(false);
    }
  }, [sido, sigungu, searchType]);

  // Client-side filtering and pagination
  useEffect(() => {
    let filtered = [...rawResults];
    
    // Filter by hospital type
    if (searchType === 'hospital' && hospitalTypes.length > 0) {
      if (hospitalTypes[0] === 'NONE') {
        filtered = [];
      } else {
        filtered = filtered.filter(item => {
          if (!(item as any).divCode) return false;
          return hospitalTypes.includes((item as any).divCode);
        });
      }
    }

    // Filter by open now
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
    
  }, [rawResults, hospitalTypes, showOpenOnly, currentPage, searchType]);

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
    
    setIsLocationMode(useLocation);

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

    const performSearch = async (lat?: number, lon?: number) => {
      try {
        if (searchType === 'pharmacy') {
          // Use SafeMap API for pharmacies
          if (!cachedPharmacies) {
            const apiKey = import.meta.env.VITE_PHARMACY_API_KEY;
            const targetUrl = `https://safemap.go.kr/openapi2/IF_0048?serviceKey=${apiKey}&pageNo=1&numOfRows=30000&returnType=JSON`;
            // Use CORS proxy for browser access
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.header?.resultCode !== '00') {
              setError(`API 오류: ${data.header?.errorMsg || data.header?.resultMsg}`);
              setIsSearching(false);
              return;
            }
            cachedPharmacies = data.body?.items?.item || [];
          }

          let parsedResults: PharmacyData[] = [];
          const itemsToProcess = cachedPharmacies || [];
          for (const item of itemsToProcess) {
            const dutyName = item.dutyname || '';
            const dutyAddr = item.dutyaddr || '';
            
            if (!useLocation) {
              if (sido && !dutyAddr.includes(sido)) continue;
              if (sigungu && !dutyAddr.includes(sigungu)) continue;
              if (pharmacyName && !dutyName.includes(pharmacyName)) continue;
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
              setError('반경 5km 이내에 검색 결과가 없습니다.');
            }
            setRawResults(filtered);
          } else {
            setRawResults(parsedResults);
          }

        } else {
          // Use data.go.kr API for hospitals
          const apiKey = import.meta.env.VITE_HOSPITAL_API_KEY;
          let url = '';
          
          if (useLocation && lat && lon) {
            url = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncLcinfoInqire?serviceKey=${apiKey}&WGS84_LON=${lon}&WGS84_LAT=${lat}&pageNo=1&numOfRows=2000`;
          } else {
            url = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${apiKey}&Q0=${encodeURIComponent(sido)}&pageNo=1&numOfRows=2000`;
            if (sigungu) url += `&Q1=${encodeURIComponent(sigungu)}`;
            if (pharmacyName) url += `&QN=${encodeURIComponent(pharmacyName)}`;
          }
          
          const response = await fetch(url);
          const text = await response.text();
          
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          
          const errMsgData = xmlDoc.getElementsByTagName("errMsg")[0]?.textContent;
          const resultMsg = xmlDoc.getElementsByTagName("resultMsg")[0]?.textContent;
          
          if (errMsgData || (resultMsg && resultMsg !== 'NORMAL_SERVICE' && resultMsg !== '정상')) {
            setError(`API 오류: ${errMsgData || resultMsg}`);
            setRawResults([]);
            setIsSearching(false);
            return;
          }

          const items = xmlDoc.getElementsByTagName("item");
          let parsedResults: PharmacyData[] = [];
          
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const getText = (tag: string, tagLower: string = '') => {
              return item.getElementsByTagName(tag)[0]?.textContent || 
                     (tagLower ? item.getElementsByTagName(tagLower)[0]?.textContent : '') || '';
            };
            
            const dutyName = getText('dutyName', 'dutyname');
            if (!useLocation && pharmacyName && !dutyName.includes(pharmacyName)) continue;

            let type = '';
            const divCode = getText('dutyDiv', 'dutydiv');
            
            if (divCode === 'W') {
              type = '부속의원';
            } else if (divCode === 'U') {
              type = '보건의료원';
            } else if (type === '보건소' || divCode === 'R') {
              if (dutyName.includes('보건진료소')) {
                type = '보건진료소';
              } else if (dutyName.includes('보건지소')) {
                type = '보건지소';
              } else {
                type = '보건소';
              }
            } else if (!type) {
              type = '병원';
            }
            
            if (type && type.includes('구급차')) {
              continue;
            }
            
            const times: Record<number, {s: string, c: string} | null> = {};
            for (let d = 1; d <= 8; d++) {
              const s = getText(`dutyTime${d}s`, `dutytime${d}s`);
              const c = getText(`dutyTime${d}c`, `dutytime${d}c`);
              if (s && c) {
                times[d] = { s, c };
              }
            }
            
            parsedResults.push({
              id: getText('hpid', 'hpid') || `id-${i}`,
              name: dutyName,
              address: getText('dutyAddr', 'dutyaddr'),
              tel: getText('dutyTel1', 'dutytel1'),
              lat: parseFloat(getText('wgs84Lat', 'lat')) || parseFloat(getText('latitude', 'latitude')) || 0,
              lng: parseFloat(getText('wgs84Lon', 'lon')) || parseFloat(getText('longitude', 'longitude')) || 0,
              type: type,
              divCode: divCode,
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
              setError('반경 5km 이내에 검색 결과가 없습니다.');
            }
            setRawResults(filtered);
          } else {
            setRawResults(parsedResults);
          }
        }
      } catch (err) {
        console.error(err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsSearching(false);
      }
    };
    if (useLocation) {
      if (targetPage > 1 && lastCoords) {
        performSearch(lastCoords.lat, lastCoords.lon);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLastCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            performSearch(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.error(err);
            setError('위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.');
            setIsSearching(false);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    } else {
      performSearch();
    }
  };

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
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={btnStyle(false, currentPage === 1)}>
          &lt;&lt;
        </button>
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} style={btnStyle(false, currentPage === 1)}>
          &lt;
        </button>
        
        {pages.map(p => (
          <button key={p} onClick={() => setCurrentPage(p)} style={btnStyle(currentPage === p)}>
            {p}
          </button>
        ))}
        
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} style={btnStyle(false, currentPage === totalPages)}>
          &gt;
        </button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} style={btnStyle(false, currentPage === totalPages)}>
          &gt;&gt;
        </button>
      </div>
    );
  };

  const bgImage = searchType === 'pharmacy' ? `${import.meta.env.BASE_URL}images/pharmacy_bg.jpg` : `${import.meta.env.BASE_URL}images/hospital_bg.jpg`;

  return (
    <AppContainer title="약국/병원 찾기" onBack={onBack} bgImage={bgImage}>
      <PharmacySearch 
        searchType={searchType} setSearchType={setSearchType}
        sido={sido} setSido={setSido}
        sigungu={sigungu} setSigungu={setSigungu}
        pharmacyName={pharmacyName} setPharmacyName={setPharmacyName}
        hospitalTypes={hospitalTypes} setHospitalTypes={setHospitalTypes}
        showOpenOnly={showOpenOnly} setShowOpenOnly={setShowOpenOnly}
        onSearch={(useLocation) => handleSearch(useLocation)}
        isSearching={isSearching}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} color="#06b6d4" />
            <p style={{ color: 'var(--text-muted)' }}>{searchType === 'pharmacy' ? '약국' : '병원'} 정보를 불러오는 중...</p>
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
            <p style={{ color: 'var(--text-muted)' }}>지역을 선택하고 {searchType === 'pharmacy' ? '약국' : '병원'}을 검색해보세요.</p>
          </div>
        )}
        
        {!isSearching && results.map(item => (
          <PharmacyCard key={item.id} pharmacy={item} isHospital={searchType === 'hospital'} />
        ))}
        
        {renderPagination()}
      </div>
    </AppContainer>
  );
}
