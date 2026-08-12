import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, MapPin, Search, ChevronDown, ChevronUp, ExternalLink, Heart, Clock, Phone, Navigation } from 'lucide-react';
import './RestaurantApp.css';

interface RestaurantAppProps {
  onBack: () => void;
}

const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const KAKAO_REST_API_KEY = '167bb3713d47a624020a8820a96b95b3';

interface Place {
  id: string;
  place_name: string;
  category_name: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string;
  y: string;
  place_url: string;
  distance: string;
}

export function RestaurantApp({ onBack }: RestaurantAppProps) {
  const [region, setRegion] = useState('울산');
  const [keyword, setKeyword] = useState('맛집');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showOnlyFav, setShowOnlyFav] = useState(false);
  const [page, setPage] = useState(1);
  const [isEnd, setIsEnd] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Refs for observer
  const loadingRef = useRef(loading);
  const isEndRef = useRef(isEnd);
  const errorRef = useRef(error);

  useEffect(() => {
    loadingRef.current = loading;
    isEndRef.current = isEnd;
    errorRef.current = error;
  }, [loading, isEnd, error]);

  // Load favorites
  useEffect(() => {
    const saved = localStorage.getItem('RESTAURANT_FAVORITES');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('RESTAURANT_FAVORITES', JSON.stringify(favorites));
  }, [favorites]);

  const searchPlaces = async (pageNum: number) => {
    if (!region && !keyword) return;

    setLoading(true);
    setError(null);
    try {
      const query = `${region} ${keyword}`.trim();
      const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
      const response = await fetch(`${baseUrl}/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&page=${pageNum}&size=15`, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      setPlaces(prev => pageNum === 1 ? data.documents : [...prev, ...data.documents]);
      // Kakao API max page is 3 for size=15 (45 items max)
      setIsEnd(data.meta.is_end || pageNum >= 3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setIsEnd(false);
    setPlaces([]);
    searchPlaces(1);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (page > 1) {
      searchPlaces(page);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loadingRef.current && !isEndRef.current && !errorRef.current) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.1 });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const openLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const getExactSearchQuery = (place: Place) => {
    return encodeURIComponent(place.place_name);
  };

  const filteredPlaces = showOnlyFav ? places.filter(p => favorites.includes(p.id)) : places;

  return (
    <div className="restaurant-app-container">
      <header className="restaurant-header">
        <div className="header-top">
          <button className="back-btn" onClick={onBack}>
            <ChevronLeft size={24} />
          </button>
          <div className="header-title-wrapper">
            <h1 className="header-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1.2em" height="1.2em">
                <path d="M 10 7 Q 32 11 54 7 Q 58 18 64 24 L 0 24 Q 6 18 10 7 Z" fill="#be185d"/>
                <path d="M 1 24 A 3 3 0 0 1 7 24 A 3 3 0 0 1 13 24 A 3 3 0 0 1 19 24 A 3 3 0 0 1 25 24 A 3 3 0 0 1 31 24 A 3 3 0 0 1 37 24 A 3 3 0 0 1 43 24 A 3 3 0 0 1 49 24 A 3 3 0 0 1 55 24 A 3 3 0 0 1 61 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
                <rect x="2" y="24" width="60" height="4" fill="#be185d"/>
                <rect x="14" y="28" width="6" height="22" fill="#be185d"/>
                <rect x="44" y="28" width="6" height="22" fill="#be185d"/>
                <rect x="10" y="50" width="14" height="4" fill="#be185d"/>
                <rect x="40" y="50" width="14" height="4" fill="#be185d"/>
                <circle cx="32" cy="39" r="22" fill="#ffffff"/>
                <g transform="rotate(34 32 39)">
                  <circle cx="32" cy="39" r="21" fill="#ec4899"/>
                  <path d="M 11 39 a 21 21 0 1 1 42 0 a 10.5 10.5 0 0 0 -21 0 a 10.5 10.5 0 0 1 -21 0" fill="#be185d"/>
                </g>
                <text x="32" y="39" fontFamily="Pretendard, sans-serif" fontWeight="900" fontSize="15" fill="#ffffff" textAnchor="middle" dominantBaseline="middle" letterSpacing="-1">맛집</text>
              </svg>
              맛집 추천
            </h1>
            <span className="header-subtitle">카카오 Local API 연동</span>
          </div>
          <button 
            className={`fav-filter-btn ${showOnlyFav ? 'active' : ''}`}
            onClick={() => setShowOnlyFav(!showOnlyFav)}
          >
            <Heart size={20} fill={showOnlyFav ? "currentColor" : "none"} />
            <span className="fav-count">{favorites.length}</span>
          </button>
        </div>
        <div className="controls">
          <select 
            className="region-select" 
            value={region} 
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">전국</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="search-wrapper">
            <input 
              type="text" 
              className="search-input" 
              placeholder="예: 맛집, 카페, 국밥..." 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              <Search size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="restaurant-list">
        {error && (
          <div className="empty-state">
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
          </div>
        )}
        
        {filteredPlaces.length === 0 && !loading && !error && (
          <div className="empty-state">
            조건에 맞는 맛집이 없습니다.
          </div>
        )}

        {filteredPlaces.map(place => {
          const isFav = favorites.includes(place.id);
          const isExpanded = expandedId === place.id;
          const exactQuery = getExactSearchQuery(place);

          return (
            <div 
              key={place.id} 
              className={`restaurant-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => setExpandedId(isExpanded ? null : place.id)}
            >
              <div className="card-header">
                <div className="title-wrapper">
                  <button 
                    className={`favorite-btn ${isFav ? 'active' : ''}`} 
                    onClick={(e) => toggleFavorite(e, place.id)}
                  >
                    <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                  </button>
                  <div className="restaurant-name">{place.place_name}</div>
                </div>
                <div className="badge-group">
                  {place.category_group_name && <span className="badge badge-primary">{place.category_group_name}</span>}
                  <span className="badge badge-outline">{place.category_name.split(' > ').pop()}</span>
                </div>
              </div>
              
              <div className="restaurant-address-container">
                <div className="restaurant-address">
                  <MapPin size={14} className="mr-1 inline text-gray-500" /> 
                  {place.road_address_name || place.address_name}
                </div>
                <div className="address-actions">
                  <button className="brand-tag tag-kakao" onClick={(e) => openLink(e, `https://map.kakao.com/link/map/${exactQuery},${place.y},${place.x}`)}>KaKao Map</button>
                  <button className="brand-tag tag-naver" onClick={(e) => openLink(e, `https://map.naver.com/v5/search/${exactQuery}`)}>Naver Map</button>
                </div>
              </div>

              <div className="expand-indicator">
                <span className="indicator-text">{isExpanded ? '접기' : '자세히 보기'}</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {isExpanded && (
                <div className="card-details">
                  <div className="restaurant-meta-grid">
                    <div className="meta-item full-width">
                      <span className="meta-icon"><Navigation size={16} /></span>
                      <div className="meta-text">
                        <strong>지번 주소</strong>
                        <span>{place.address_name || '-'}</span>
                      </div>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon"><Phone size={16} /></span>
                      <div className="meta-text">
                        <strong>전화번호</strong>
                        <span>{place.phone || '-'}</span>
                      </div>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon"><ExternalLink size={16} /></span>
                      <div className="meta-text">
                        <strong>상세정보</strong>
                        <span onClick={(e) => openLink(e, place.place_url)} style={{color: 'var(--primary)', cursor: 'pointer'}}>카카오맵 열기</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="action-icons">
                    <button className="brand-tag tag-insta" onClick={(e) => openLink(e, `https://www.instagram.com/explore/tags/${place.place_name.replace(/\s+/g, '')}/`)}>Instagram</button>
                    <button className="brand-tag tag-youtube" onClick={(e) => openLink(e, `https://www.youtube.com/results?search_query=${exactQuery}+맛집`)}>YouTube</button>
                    <button className="brand-tag tag-blog" onClick={(e) => openLink(e, `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${exactQuery}+맛집`)}>Blog</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">데이터를 불러오는 중입니다...</div>
          </div>
        )}
        {!showOnlyFav && !isEnd && !error && (
          <div ref={observerTarget} style={{ height: '20px', width: '100%' }}></div>
        )}
      </main>
    </div>
  );
}
