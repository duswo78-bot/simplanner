import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { POI } from './OdsayApi';
import { searchPlaces } from './VworldApi';
import { searchStations } from './OdsayApi';

interface StationSearchInputProps {
  placeholder: string;
  value: POI | null;
  onSelect: (poi: POI) => void;
  iconColor?: string;
}

const POPULAR_POIS: POI[] = [
  { id: 90001, name: '울산', address: '울산광역시 남구 신정동', x: 129.3114, y: 35.5384 },
  { id: 90002, name: '울산역', address: '울산광역시 울주군 삼남읍 울산역로 177', x: 129.1386, y: 35.5518 },
  { id: 90003, name: '태화강역', address: '울산광역시 남구 산업로 654', x: 129.3516, y: 35.5387 },
  { id: 90004, name: '신암항(울산)', address: '울산광역시 울주군 서생면 신암해안길 39-1', x: 129.3524, y: 35.3486 },
  { id: 90005, name: '서울역', address: '서울특별시 용산구 한강대로 405', x: 126.9706, y: 37.5546 },
  { id: 90006, name: '강남역', address: '서울특별시 강남구 강남대로 396', x: 127.0276, y: 37.4979 },
  { id: 90007, name: '부산역', address: '부산광역시 동구 중앙대로 206', x: 129.0416, y: 35.1152 },
  { id: 90008, name: '대구역', address: '대구광역시 북구 칠성동2가', x: 128.5960, y: 35.8764 },
  { id: 90009, name: '광주송정역', address: '광주광역시 광산구 상무대로 201', x: 126.7914, y: 35.1378 },
  { id: 90010, name: '대전역', address: '대전광역시 동구 중앙로 215', x: 127.4342, y: 36.3315 },
  { id: 90011, name: '인천공항', address: '인천광역시 중구 공항로 272', x: 126.4505, y: 37.4692 },
  { id: 90012, name: '홍대입구역', address: '서울특별시 마포구 양화로 160', x: 126.9244, y: 37.5575 },
  { id: 90013, name: '잠실역', address: '서울특별시 송파구 올림픽로 265', x: 127.1002, y: 37.5133 },
  { id: 90014, name: '해운대역', address: '부산광역시 해운대구 해운대로 620', x: 129.1586, y: 35.1587 },
];

export function StationSearchInput({ placeholder, value, onSelect, iconColor = 'rgba(255,255,255,0.5)' }: StationSearchInputProps) {
  const [query, setQuery] = useState(value ? value.name : '');
  const [results, setResults] = useState<POI[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(value.name);
    }
  }, [value]);

  useEffect(() => {
    // Close dropdown on outside click
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q || (value && q === value.name)) {
      setResults([]);
      return;
    }

    // Instant filter from local popular list
    const localMatches = POPULAR_POIS.filter(p => 
      p.name.includes(q) || (p.address && p.address.includes(q))
    );

    if (localMatches.length > 0) {
      setResults(localMatches);
      setIsOpen(true);
    }

    const timerId = setTimeout(async () => {
      setIsLoading(true);
      
      let fetchedData: POI[] = [];
      try {
        fetchedData = await searchPlaces(q);
      } catch (e) {
        console.warn('VWorld search failed, using fallback', e);
      }
      
      // Fallback to ODsay station search if Vworld returns no results
      if (!fetchedData || fetchedData.length === 0) {
        try {
          const odsayData = await searchStations(q);
          if (odsayData && odsayData.length > 0) {
            fetchedData = odsayData;
          }
        } catch (e) {
          console.warn('ODsay station search failed', e);
        }
      }
      
      // Merge local matches and fetched results
      const combined = [...localMatches];
      fetchedData.forEach(item => {
        if (!combined.some(c => c.name === item.name)) {
          combined.push(item);
        }
      });

      if (combined.length === 0) {
        setResults([{ id: -1, name: '검색 결과 없음', address: '명칭이나 정류장 이름을 다시 확인해주세요.', x: 0, y: 0 }]);
      } else {
        setResults(combined);
      }
      
      setIsOpen(true);
      setIsLoading(false);
    }, 200); // 200ms debounce for quick response

    return () => clearTimeout(timerId);
  }, [query, value]);

  const handleSelect = (poi: POI) => {
    if (poi.id === -1) return;
    setQuery(poi.name);
    setIsOpen(false);

    // Save to recent stations
    try {
      const recentStr = localStorage.getItem('recent_stations');
      let recents: POI[] = recentStr ? JSON.parse(recentStr) : [];
      recents = recents.filter(r => r.name !== poi.name); // Remove duplicate
      recents.unshift(poi); // Add to front
      if (recents.length > 6) recents = recents.slice(0, 6);
      localStorage.setItem('recent_stations', JSON.stringify(recents));
      window.dispatchEvent(new Event('recent_stations_updated'));
    } catch (e) {
      console.error('Failed to save recent station:', e);
    }

    onSelect(poi);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <Search size={18} color={iconColor} style={{ position: 'absolute', left: '12px', top: '14px' }} />
      <input 
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
          // Auto-select text on focus to make it easy to clear
          if (query) setTimeout(() => document.execCommand('selectAll', false, undefined), 50);
        }}
        placeholder={placeholder}
        style={{ 
          width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', 
          background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
          outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box'
        }}
      />
      {isLoading && (
        <Loader2 size={16} color="rgba(255,255,255,0.5)" className="animate-spin" style={{ position: 'absolute', right: '12px', top: '15px' }} />
      )}

      {isOpen && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
          background: '#1f2937', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 9999,
          maxHeight: '240px', overflowY: 'auto'
        }}>
          {results.map((st) => (
            <div 
              key={st.id} 
              onClick={() => handleSelect(st)}
              style={{
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MapPin size={16} color="#9ca3af" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>{st.name}</span>
                {st.address && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{st.address}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
