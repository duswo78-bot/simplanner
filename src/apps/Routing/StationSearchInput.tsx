import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import type { POI } from './OdsayApi';
import { searchPlaces } from './VworldApi';

interface StationSearchInputProps {
  placeholder: string;
  value: POI | null;
  onSelect: (poi: POI) => void;
  iconColor?: string;
}

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
    if (!query.trim() || (value && query === value.name)) {
      setResults([]);
      return;
    }

    const timerId = setTimeout(async () => {
      setIsLoading(true);
      const data = await searchPlaces(query);
      setResults(data);
      setIsOpen(true);
      setIsLoading(false);
    }, 400); // 400ms debounce

    return () => clearTimeout(timerId);
  }, [query, value]);

  const handleSelect = (poi: POI) => {
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
