import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, MapPin, Search, ChevronDown, ChevronUp, Heart, Phone, Navigation, Map, Image } from 'lucide-react';
import './RestaurantApp.css';

interface RestaurantAppProps {
  onBack: () => void;
}

const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const RESTAURANT_CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '카페', '베이커리', '분식', '고기/구이', '치킨', '피자', '아시안', '패스트푸드', '기타'];
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
  const [category, setCategory] = useState('전체');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchIdRef = useRef(0);
  
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

  const searchPlaces = async (pageNum: number, isLocation = useLocation, lat = userCoords?.lat, lng = userCoords?.lng, cat = category) => {
    if (!isLocation && !region && !keyword) return;

    const currentSearchId = ++searchIdRef.current;

    setLoading(true);
    setError(null);
    try {
      let queryUrl = '';
      const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
      
      if (isLocation && lat && lng) {
        // 내 주변 5km 검색 (반경 5000m, 거리순)
        let q = keyword || '맛집';
        if (cat !== '전체') q += ` ${cat}`;
        queryUrl = `${baseUrl}/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&x=${lng}&y=${lat}&radius=5000&sort=distance&page=${pageNum}&size=15`;
      } else {
        // 일반 지역 + 키워드 검색
        let query = `${region} ${keyword}`.trim();
        if (cat !== '전체') query += ` ${cat}`;
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
      
      if (searchIdRef.current !== currentSearchId) return;

      if (pageNum === 1) {
        setPlaces(data.documents);
      } else {
        setPlaces(prev => [...prev, ...data.documents]);
      }
      setIsEnd(data.meta.is_end);
    } catch (err) {
      if (searchIdRef.current !== currentSearchId) return;
      setError('맛집 정보를 가져오는데 실패했습니다.');
      console.error(err);
    } finally {
      if (searchIdRef.current === currentSearchId) {
        setLoading(false);
      }
    }
  };

  const handleSearch = (useLoc = useLocation, cat = category) => {
    setPage(1);
    setIsEnd(false);
    setUseLocation(useLoc);
    
    if (useLoc) {
      if (userCoords) {
        searchPlaces(1, true, userCoords.lat, userCoords.lng, cat);
      } else {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserCoords({ lat, lng });
            searchPlaces(1, true, lat, lng, cat);
          },
          (err) => {
            setLoading(false);
            setError('위치 정보를 가져올 수 없습니다. 설정에서 위치 권한을 확인해주세요.');
            setUseLocation(false);
          }
        );
      }
    } else {
      searchPlaces(1, false, userCoords?.lat, userCoords?.lng, cat);
    }
  };

  // 내 주변 모드일 때 무한스크롤 등에서 좌표 재사용
  useEffect(() => {
    if (page > 1) {
      searchPlaces(page, useLocation, userCoords?.lat, userCoords?.lng, category);
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
        <div className="category-chips">
          {RESTAURANT_CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`chip-btn ${category === cat ? 'active' : ''}`}
              onClick={() => {
                setCategory(cat);
                handleSearch(useLocation, cat);
              }}
            >
              {cat}
            </button>
          ))}
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
                </div>
              </div>

              {isExpanded && (
                <div className="card-details">
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div className="meta-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                      <div className="meta-item">
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
                          <span>{place.phone ? <a href={`tel:${place.phone}`} className="phone-link">{place.phone}</a> : '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mini-map-container" style={{ width: '100px', height: '100px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', background: '#eee', position: 'relative' }}>
                      <iframe 
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(place.x)-0.002},${parseFloat(place.y)-0.002},${parseFloat(place.x)+0.002},${parseFloat(place.y)+0.002}&layer=mapnik`}
                        title="Mini Map"
                        style={{ 
                          width: '200px', 
                          height: '200px', 
                          border: 0, 
                          position: 'absolute',
                          top: '-50px',
                          left: '-50px',
                          pointerEvents: 'none'
                        }}
                      />
                      <div className="custom-marker">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#e11d48" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3" fill="white" stroke="white" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="action-icons">
                    <button className="brand-tag tag-naver-place" onClick={(e) => openLink(e, `https://m.place.naver.com/search?query=${exactQuery}`)}>SmartPlace</button>
                    <button className="brand-tag tag-insta" onClick={(e) => openLink(e, `https://www.instagram.com/explore/tags/${place.place_name.replace(/\s+/g, '')}/`)}>Instagram</button>
                    <button className="brand-tag tag-youtube" onClick={(e) => openLink(e, `https://www.youtube.com/results?search_query=${exactQuery}+맛집`)}>YouTube</button>
                    <button className="brand-tag tag-blog" onClick={(e) => openLink(e, `https://search.naver.com/search.naver?ssc=tab.blog.all&sm=tab_jum&query=${exactQuery}+맛집`)}>Blog</button>
                    <button className="brand-tag tag-yogiyo" onClick={(e) => openLink(e, `yogiyoapp://search?keyword=${exactQuery}`)}>요기요</button>
                  </div>
                </div>
              )}
              
              <div className="card-footer">
                <button 
                  className="photo-btn"
                  onClick={(e) => openLink(e, `https://www.google.com/search?tbm=isch&q=${exactQuery}`)}
                  title="사진 검색"
                >
                  <Image size={18} />
                </button>
                <div style={{ flex: 1 }}></div>
                {place.distance && (
                  <span className="distance-badge" style={{ marginRight: '8px' }}>
                    {(parseInt(place.distance) / 1000).toFixed(1)}km
                  </span>
                )}
                <button 
                  className="expand-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedId(isExpanded ? null : place.id);
                  }}
                >
                  {isExpanded ? '접기' : '자세히 보기'}
                  <ChevronDown size={16} className={`chevron ${isExpanded ? 'up' : ''}`} />
                </button>
              </div>
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
