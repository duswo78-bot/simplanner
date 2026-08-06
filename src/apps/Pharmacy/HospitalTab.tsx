import React, { useState, useEffect, useRef } from 'react';
import { Pill, RefreshCw } from 'lucide-react';
import { PharmacySearch } from './PharmacySearch';
import { PharmacyCard } from './PharmacyCard';
import type { PharmacyData } from './PharmacyCard';

interface HospitalTabProps {
  sido: string;
  setSido: (val: string) => void;
  sigungu: string;
  setSigungu: (val: string) => void;
  pharmacyName: string;
  setPharmacyName: (val: string) => void;
  hospitalTypes: string[];
  setHospitalTypes: (val: string[]) => void;
  showOpenOnly: boolean;
  setShowOpenOnly: (val: boolean) => void;
  searchType: 'pharmacy' | 'hospital';
  setSearchType: (val: 'pharmacy' | 'hospital') => void;
}

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

export function HospitalTab({
  sido, setSido, sigungu, setSigungu, pharmacyName, setPharmacyName,
  hospitalTypes, setHospitalTypes, showOpenOnly, setShowOpenOnly,
  searchType, setSearchType
}: HospitalTabProps) {
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
        const apiKey = import.meta.env.VITE_HOSPITAL_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
        let searchSido = sido;
        
        // If GPS is used and we don't have a sido, use VWorld Reverse Geocoding
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

        let urls: string[] = [];
        
        if (searchSido === '전남광주통합특별시') {
          let url1 = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${apiKey}&Q0=${encodeURIComponent('전라남도')}&pageNo=1&numOfRows=20000`;
          let url2 = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${apiKey}&Q0=${encodeURIComponent('광주광역시')}&pageNo=1&numOfRows=20000`;
          if (!useLocation && sigungu) {
            url1 += `&Q1=${encodeURIComponent(sigungu)}`;
            url2 += `&Q1=${encodeURIComponent(sigungu)}`;
          }
          if (!useLocation && pharmacyName) {
            url1 += `&QN=${encodeURIComponent(pharmacyName)}`;
            url2 += `&QN=${encodeURIComponent(pharmacyName)}`;
          }
          urls.push(url1, url2);
        } else {
          let url = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlMdcncListInfoInqire?serviceKey=${apiKey}&Q0=${encodeURIComponent(searchSido)}&pageNo=1&numOfRows=20000`;
          if (!useLocation && sigungu) url += `&Q1=${encodeURIComponent(sigungu)}`;
          if (!useLocation && pharmacyName) url += `&QN=${encodeURIComponent(pharmacyName)}`;
          urls.push(url);
        }
        
        let allItems: any[] = [];
        for (const url of urls) {
          try {
            const response = await fetch(url);
            const text = await response.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            
            const errMsgData = xmlDoc.getElementsByTagName("errMsg")[0]?.textContent;
            const resultMsg = xmlDoc.getElementsByTagName("resultMsg")[0]?.textContent;
            
            if (errMsgData || (resultMsg && !resultMsg.includes('NORMAL') && resultMsg !== '정상' && resultMsg !== 'NORMAL SERVICE.')) {
              if (urls.length === 1) {
                setError(`API 오류: ${errMsgData || resultMsg}`);
                setRawResults([]);
                setIsSearching(false);
                return;
              } else {
                continue;
              }
            }

            const items = xmlDoc.getElementsByTagName("item");
            for (let i = 0; i < items.length; i++) {
              allItems.push(items[i]);
            }
          } catch(e: any) {
            if (urls.length === 1) {
              throw e;
            }
          }
        }
        
        let parsedResults: PharmacyData[] = [];
        
        for (let i = 0; i < allItems.length; i++) {
          const item = allItems[i];
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
            address: getText('dutyAddr', 'dutyaddr').replace(/^(전라남도|전남|광주광역시|광주)\s*/, '전남광주통합특별시 '),
            tel: getText('dutyTel1', 'dutytel1'),
            lat: parseFloat(getText('wgs84Lat', 'lat')) || 0,
            lng: parseFloat(getText('wgs84Lon', 'lon')) || 0,
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
            setError('반경 5km 이내에 병원이 없습니다.');
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
          setError('위치 정보를 가져올 수 없습니다. 권한을 확인해주세요.');
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
    
    if (hospitalTypes.length > 0) {
      if (hospitalTypes[0] === 'NONE') {
        filtered = [];
      } else {
        filtered = filtered.filter(item => {
          if (!item.divCode) return false;
          return hospitalTypes.includes(item.divCode);
        });
      }
    }

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
    
  }, [rawResults, hospitalTypes, showOpenOnly, currentPage]);

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
        hospitalTypes={hospitalTypes} setHospitalTypes={setHospitalTypes}
        showOpenOnly={showOpenOnly} setShowOpenOnly={setShowOpenOnly}
        onSearch={(useLocation) => handleSearch(useLocation)}
        isSearching={isSearching}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
        {isSearching && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <RefreshCw className="animate-spin mx-auto mb-4" size={32} color="#06b6d4" />
            <p style={{ color: 'var(--text-muted)' }}>병원 정보를 불러오는 중...</p>
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
            <p style={{ color: 'var(--text-muted)' }}>지역을 선택하고 병원을 검색해보세요.</p>
          </div>
        )}
        
        {!isSearching && results.map(item => (
          <PharmacyCard key={item.id} pharmacy={item} isHospital={true} />
        ))}
        
        {renderPagination()}
      </div>
    </>
  );
}
