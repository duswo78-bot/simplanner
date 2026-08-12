import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, MapPin, Search, ChevronDown, ChevronUp, Heart, Phone, Navigation, Map, Compass } from 'lucide-react';
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
  
  // 5km sorting state
  const [useLocation, setUseLocation] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

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

  const searchPlaces = async (pageNum: number, isLocation = useLocation, lat = userCoords?.lat, lng = userCoords?.lng) => {
    if (!isLocation && !region && !keyword) return;

    setLoading(true);
    setError(null);
    try {
      let queryUrl = '';
      const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
      
      if (isLocation && lat && lng) {
        // 내 주변 5km 검색 (반경 5000m, 거리순)
        const q = keyword || '맛집';
        queryUrl = `${baseUrl}/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${lng}&y=${lat}&radius=5000&sort=distance&page=${pageNum}&size=15`;
      } else {
        // 일반 지역 + 키워드 검색
        const query = `${region} ${keyword}`.trim();
        queryUrl = `${baseUrl}/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&page=${pageNum}&size=15`;
      }

      const response = await fetch(queryUrl, {
        headers: {
          'Authorization': `KakaoAK ${KAKAO_REST_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const data = await response.json();
      
      setPlaces(prev => pageNum === 1 ? data.documents : [...prev, ...data.documents]);
      setIsEnd(data.meta.is_end || pageNum >= 3);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (useLoc = false) => {
    setPage(1);
    setIsEnd(false);
    setPlaces([]);
    setUseLocation(useLoc);
    
    if (useLoc) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords({ lat, lng });
          searchPlaces(1, true, lat, lng);
        },
        (err) => {
          setLoading(false);
          setError('위치 정보를 가져올 수 없습니다. 설정에서 위치 권한을 확인해주세요.');
          setUseLocation(false);
        }
      );
    } else {
      searchPlaces(1, false);
    }
  };

  // 내 주변 모드일 때 무한스크롤 등에서 좌표 재사용
  useEffect(() => {
    if (page > 1) {
      searchPlaces(page, useLocation, userCoords?.lat, userCoords?.lng);
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
    const regionPrefix = place.address_name.split(' ').slice(0, 2).join(' ');
    return encodeURIComponent(`${regionPrefix} ${place.place_name}`);
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
            <h1 className="header-title">맛집 추천</h1>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
            />
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="action-btn location-btn"
              onClick={() => handleSearch(true)}
              title="내 주변 5km 검색"
            >
              <Navigation size={18} style={{ marginBottom: '2px' }} />
              <span className="location-btn-text">5km</span>
            </button>
            <button 
              className="action-btn search-btn" 
              onClick={() => handleSearch(false)}
              title="검색하기"
            >
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
                  <div className="restaurant-name">{place.place_name}</div>
                  <div className="badge-group">
                    {place.category_group_name && <span className="badge badge-primary">{place.category_group_name}</span>}
                    <span className="badge badge-outline">{place.category_name.split(' > ').pop()}</span>
                  </div>
                </div>
                <button 
                  className={`favorite-btn ${isFav ? 'active' : ''}`} 
                  onClick={(e) => toggleFavorite(e, place.id)}
                >
                  <Heart size={20} fill={isFav ? "currentColor" : "none"} />
                </button>
              </div>
              
              <div className="restaurant-address-container">
                <div className="restaurant-address">
                  <MapPin size={14} className="mr-1 inline text-gray-500" /> 
                  {place.road_address_name || place.address_name}
                </div>
                <div className="address-actions">
                  <button className="brand-tag tag-kakao" onClick={(e) => openLink(e, place.place_url)}>KaKao Map</button>
                  <button className="brand-tag tag-naver" onClick={(e) => openLink(e, `https://map.naver.com/p/search/${encodeURIComponent(place.road_address_name || place.address_name)}`)}>Naver Map</button>
                  {place.distance && (
                    <span className="distance-badge">
                      {(parseInt(place.distance) / 1000).toFixed(1)}km
                    </span>
                  )}
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
                      <span className="meta-icon"><Map size={16} /></span>
                      <div className="meta-text">
                        <strong>상세 분류</strong>
                        <span>{place.category_name || '-'}</span>
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
                      <span className="meta-icon"><Navigation size={16} /></span>
                      <div className="meta-text">
                        <strong>지번 주소</strong>
                        <span>{place.address_name || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="action-icons">
                    <button className="brand-tag tag-naver-place" onClick={(e) => openLink(e, `https://m.place.naver.com/search?query=${exactQuery}`)}>SmartPlace</button>
                    <button className="brand-tag tag-insta" onClick={(e) => openLink(e, `https://www.instagram.com/explore/tags/${place.place_name.replace(/\s+/g, '')}/`)}>Instagram</button>
                    <button className="brand-tag tag-youtube" onClick={(e) => openLink(e, `https://www.youtube.com/results?search_query=${exactQuery}+맛집`)}>YouTube</button>
                    <button className="brand-tag tag-blog" onClick={(e) => openLink(e, `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${exactQuery}+맛집`)}>Blog</button>
                    <button className="brand-tag tag-yogiyo" onClick={(e) => openLink(e, `https://www.google.com/search?q=요기요+${exactQuery}`)}>Yogiyo</button>
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
