import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Search,
  ShoppingCart,
  ShoppingBag,
  Heart,
  Minus,
  Plus,
  X,
  Camera,
  ClipboardList,
  Share2,
  Loader2,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  MapPin,
  Tag,
  Utensils,
} from 'lucide-react';

import { GROCERY_ITEMS, REGION_ALL, KOREAN_MEAL_PRESETS } from './groceryData';
import type { GroceryItem, Category, RegionOption, MealPreset } from './groceryData';
import { fetchPriceCatalog, attachProductImages } from './api';
import './GroceryApp.css';

interface GroceryAppProps {
  onBack: () => void;
}

interface CartItem extends GroceryItem {
  quantity: number;
}

interface SavedList {
  id: string;
  date: string;
  name: string;
  items: CartItem[];
  total: number;
}

const CATEGORIES: Category[] = ['과일/채소', '정육/수산', '유제품/계란', '간식/음료', '생필품', '기타'];
const REGION_STORAGE_KEY = 'grocery_region_code';

function GroceryCard({
  item,
  isFavorite,
  toggleFavorite,
  onAddToCart,
  viewMode,
  cartQuantity,
}: {
  item: GroceryItem;
  isFavorite: boolean;
  toggleFavorite: (id: string) => void;
  onAddToCart: (item: GroceryItem, qty: number) => void;
  viewMode: 'grid' | 'list';
  cartQuantity: number;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = item.imageUrl && !imgFailed;

  return (
    <div className={`grocery-card ${item.isDiscount || item.isPlusOne ? 'has-deal' : ''}`}>
      <button
        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={() => toggleFavorite(item.id)}
      >
        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {(item.isDiscount || item.isPlusOne) && (
        <div className="deal-badges">
          {item.isDiscount && <span className="deal-badge sale">세일</span>}
          {item.isPlusOne && <span className="deal-badge plusone">1+1</span>}
        </div>
      )}

      <div className="grocery-icon">
        {showImage ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="grocery-image-preview"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="grocery-emoji">{item.icon}</span>
        )}
      </div>

      {viewMode === 'grid' ? (
        <>
          <div className="grocery-info">
            <div className="grocery-title-row">
              <h3 className="grocery-name">{item.name}</h3>
              <div className="grocery-price-box">
                <p className={`grocery-price ${item.isDiscount || item.isPlusOne ? 'sale-price' : ''}`}>
                  {item.price.toLocaleString()}원
                </p>
                <p className="grocery-unit">/{item.unit}</p>
              </div>
            </div>
            {(item.storeName || item.inspectDay || item.isDiscount) && (
              <div className="grocery-details">
                {item.storeName && <span>🏪 {item.storeName}</span>}
                {item.inspectDay && <span>📅 {item.inspectDay}</span>}
                {item.isDiscount && item.discountStart && item.discountEnd && (
                  <span className="discount-period">
                    🏷 {item.discountStart} ~ {item.discountEnd}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="add-to-cart-controls">
            {cartQuantity > 0 ? (
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => onAddToCart(item, -1)}>
                  <Minus size={16} />
                </button>
                <span className="qty-value">{cartQuantity}</span>
                <button className="qty-btn" onClick={() => onAddToCart(item, 1)}>
                  <Plus size={16} />
                </button>
              </div>
            ) : (
              <button className="add-btn" onClick={() => onAddToCart(item, 1)} title="장바구니 담기">
                <ShoppingCart size={18} />
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grocery-info">
            <h3 className="grocery-name">{item.name}</h3>
            {(item.storeName || item.inspectDay || item.isDiscount) && (
              <div className="grocery-details">
                {item.storeName && <span>🏪 {item.storeName}</span>}
                {item.inspectDay && <span>📅 {item.inspectDay}</span>}
                {item.isDiscount && item.discountStart && item.discountEnd && (
                  <span className="discount-period">
                    🏷 {item.discountStart} ~ {item.discountEnd}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grocery-action-area">
            <div className="grocery-price-box">
              <p className={`grocery-price ${item.isDiscount || item.isPlusOne ? 'sale-price' : ''}`}>
                {item.price.toLocaleString()}원
              </p>
              <p className="grocery-unit">/{item.unit}</p>
            </div>
            <div className="add-to-cart-controls">
              {cartQuantity > 0 ? (
                <div className="qty-controls list-qty-controls">
                  <button className="qty-btn" onClick={() => onAddToCart(item, -1)}>
                    <Minus size={14} />
                  </button>
                  <span className="qty-value">{cartQuantity}</span>
                  <button className="qty-btn" onClick={() => onAddToCart(item, 1)}>
                    <Plus size={14} />
                  </button>
                </div>
              ) : (
                <button className="add-btn list-add-btn" onClick={() => onAddToCart(item, 1)} title="장바구니 담기">
                  <ShoppingCart size={16} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function GroceryApp({ onBack }: GroceryAppProps) {
  const [activeTab, setActiveTab] = useState<Category | '전체' | '즐겨찾기'>('전체');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const stored = localStorage.getItem('grocery_favorites');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [catalogItems, setCatalogItems] = useState<GroceryItem[]>([]);
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [regionCode, setRegionCode] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(REGION_STORAGE_KEY);
      return stored === REGION_ALL ? '' : (stored || '');
    } catch {
      return '';
    }
  });
  const [inspectDay, setInspectDay] = useState<string | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false); // Default false if no region
  const [isLocating, setIsLocating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dealsOnly, setDealsOnly] = useState(false);

  const [customItems, setCustomItems] = useState<GroceryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemPhoto, setNewItemPhoto] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<Category>('기타');
  const [newItemUnit, setNewItemUnit] = useState('1개');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);

  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [isSavedListsModalOpen, setIsSavedListsModalOpen] = useState(false);
  
  const [presets, setPresets] = useState<MealPreset[]>(() => {
    try {
      const stored = localStorage.getItem('grocery_meal_presets');
      if (stored) return JSON.parse(stored);
    } catch {}
    return KOREAN_MEAL_PRESETS;
  });
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<MealPreset | null>(null);

  const loadGenRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('grocery_meal_presets', JSON.stringify(presets));
  }, [presets]);

  const handleAddPresetToCart = useCallback((preset: MealPreset) => {
    setCart((prev) => {
      const next = new Map(prev);
      
      // Need displayItems here, so let's just use GROCERY_ITEMS and catalogItems directly
      // since displayItems is calculated later
      const allAvailable = [...customItems, ...(catalogItems.length > 0 ? catalogItems : GROCERY_ITEMS)];
      
      preset.ingredients.forEach(ingName => {
        const lowerName = ingName.toLowerCase();
        let match = allAvailable.find(i => i.name.toLowerCase() === lowerName);
        if (!match) {
          match = allAvailable.find(i => i.name.toLowerCase().includes(lowerName) || lowerName.includes(i.name.toLowerCase()));
        }
        
        if (match) {
          const exist = next.get(match.id);
          if (exist) {
            next.set(match.id, { ...exist, quantity: exist.quantity + 1 });
          } else {
            next.set(match.id, { ...match, quantity: 1 });
          }
        } else {
          const customId = `custom_${Date.now()}_${Math.random()}`;
          next.set(customId, {
            id: customId,
            name: ingName,
            category: '기타',
            unit: '1개',
            price: 0,
            icon: '🛒',
            source: 'custom',
            quantity: 1,
          });
        }
      });
      return next;
    });
    alert(`'${preset.name}' 재료가 장바구니에 담겼습니다.`);
    setIsPresetModalOpen(false);
  }, [catalogItems, customItems]);

  const handleFindLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
          const res = await fetch(`${baseUrl}/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`, {
            headers: { 'Authorization': 'KakaoAK 167bb3713d47a624020a8820a96b95b3' }
          });
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            const doc = data.documents[0];
            const regionName = doc.region_2depth_name || doc.region_1depth_name;
            const match = regions.find(r => r.name.includes(regionName) || regionName.includes(r.name));
            if (match) {
              setRegionCode(match.code);
            } else {
              // 일치하는 지역이 없거나 API 실패시 그냥 가짜 리전 생성해서 통과시킴
              const fakeCode = `local_${Date.now()}`;
              setRegions(prev => [{ code: fakeCode, name: regionName }, ...prev]);
              setRegionCode(fakeCode);
            }
          }
        } catch (e) {
          console.error(e);
          alert('위치 정보를 변환하는 데 실패했습니다.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        alert('위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.');
        setIsLocating(false);
      }
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem('grocery_saved_lists');
    if (stored) {
      try {
        setSavedLists(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse saved lists', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('grocery_saved_lists', JSON.stringify(savedLists));
  }, [savedLists]);

  useEffect(() => {
    try {
      localStorage.setItem(REGION_STORAGE_KEY, regionCode);
    } catch {
      /* ignore */
    }
  }, [regionCode]);

  const loadCatalog = useCallback(async (code: string) => {
    const gen = ++loadGenRef.current;
    setIsLoadingPrices(true);
    setLoadError(null);
    setCatalogItems([]);

    const safetyTimer = window.setTimeout(() => {
      if (loadGenRef.current === gen) {
        setIsLoadingPrices(false);
        setLoadError((prev) => prev || '응답이 지연되고 있습니다. 지역을 바꾸거나 다시 시도해 주세요.');
      }
    }, 40000);

    const checkCache = () => {
      try {
        const cachedStr = localStorage.getItem(`grocery_cache_${code}`);
        if (cachedStr) {
          const cached = JSON.parse(cachedStr);
          if (cached.items && cached.items.length > 0) {
            setRegions(cached.regions);
            setInspectDay(cached.inspectDay);
            setCatalogItems(cached.items);
            setLoadError('API 연결 실패로 기기에 마지막으로 저장된 최근 가격 정보를 표시합니다.');
            return true;
          }
        }
      } catch (e) {
        // ignore
      }
      return false;
    };

    try {
      const result = await fetchPriceCatalog(code);
      if (loadGenRef.current !== gen) return;
      window.clearTimeout(safetyTimer);

      if (result.items.length === 0) {
        const usedCache = checkCache();
        if (!usedCache) {
          setRegions(result.regions);
          setLoadError('이 지역에서 조회된 가격이 없거나 통신에 실패했습니다.');
        }
        setIsLoadingPrices(false);
        return;
      }

      try {
        localStorage.setItem(`grocery_cache_${code}`, JSON.stringify(result));
      } catch (e) {
        console.error('Failed to cache catalog');
      }

      setRegions(result.regions);
      setInspectDay(result.inspectDay);
      setCatalogItems(result.items);
      setIsLoadingPrices(false);

      void attachProductImages(result.items).then((withImages) => {
        if (loadGenRef.current !== gen) return;
        setCatalogItems(withImages);
        try {
          const newResult = { ...result, items: withImages };
          localStorage.setItem(`grocery_cache_${code}`, JSON.stringify(newResult));
        } catch (e) {
          /* ignore */
        }
      });
    } catch (e) {
      console.error(e);
      if (loadGenRef.current !== gen) return;
      window.clearTimeout(safetyTimer);
      
      const usedCache = checkCache();
      if (!usedCache) {
        setLoadError('가격 정보를 불러오지 못했습니다.');
        setCatalogItems([]);
      }
      setIsLoadingPrices(false);
    }
  }, []);

  useEffect(() => {
    if (!regionCode) {
      // Fetch regions list when no region is selected
      fetchPriceCatalog(REGION_ALL).then(res => {
        setRegions(res.regions);
      });
      return;
    }
    loadCatalog(regionCode);
  }, [regionCode, loadCatalog]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('grocery_favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const updateCart = (item: GroceryItem, delta: number) => {
    setCart((prev) => {
      const next = new Map(prev);
      const existing = next.get(item.id);
      const newQuantity = (existing?.quantity || 0) + delta;

      if (newQuantity <= 0) {
        next.delete(item.id);
      } else {
        next.set(item.id, { ...item, quantity: newQuantity });
      }
      return next;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setNewItemPhoto(reader.result as string);
      reader.readAsDataURL(file);

      setIsOcrLoading(true);
      try {
        const TesseractModule = await import('tesseract.js');
        const result = await TesseractModule.default.recognize(file, 'kor');
        const text = result.data.text.trim();
        if (text) {
          const firstLine = text
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 1)[0];
          if (firstLine) setNewItemName(firstLine);
        }
      } catch (err) {
        console.error('OCR failed:', err);
      } finally {
        setIsOcrLoading(false);
      }
    }
  };

  const handleAddCustomItem = () => {
    if (!newItemName || !newItemPrice) return;

    const newItem: GroceryItem = {
      id: `c_${Date.now()}`,
      name: newItemName,
      category: newItemCategory,
      unit: newItemUnit,
      price: parseInt(newItemPrice, 10) || 0,
      icon: '📸',
      imageUrl: newItemPhoto || undefined,
      source: 'custom',
    };

    setCustomItems((prev) => [newItem, ...prev]);
    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemPrice('');
    setNewItemUnit('1개');
    setNewItemCategory('기타');
    setNewItemPhoto(null);
  };

  const handleSaveList = () => {
    if (cart.size === 0) return;

    const dateStr = new Date().toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newList: SavedList = {
      id: `list_${Date.now()}`,
      date: new Date().toISOString(),
      name: `${dateStr} 장보기 목록`,
      items: Array.from(cart.values()),
      total: Array.from(cart.values()).reduce((sum, item) => sum + item.price * item.quantity, 0),
    };

    setSavedLists((prev) => [newList, ...prev]);
    setCart(new Map());
    setIsCartOpen(false);
    alert('목록이 성공적으로 저장되었습니다!');
  };

  const handleLoadList = (list: SavedList) => {
    if (cart.size > 0) {
      if (!confirm('현재 장바구니에 담긴 물품이 있습니다. 불러온 목록으로 덮어쓰시겠습니까?')) {
        return;
      }
    }
    const newCart = new Map<string, CartItem>();
    list.items.forEach((item) => newCart.set(item.id, item));
    setCart(newCart);
    setIsSavedListsModalOpen(false);
    setIsCartOpen(true);
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 목록을 삭제하시겠습니까?')) {
      setSavedLists((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleShareList = async (list: SavedList, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `🛒 ${list.name}\n\n`;
    list.items.forEach((item) => {
      text += `- ${item.name} (${item.quantity}개): ${(item.price * item.quantity).toLocaleString()}원\n`;
    });
    text += `\n💰 총 예상액: ${list.total.toLocaleString()}원`;

    if (navigator.share) {
      try {
        await navigator.share({ title: list.name, text });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('목록 내용이 클립보드에 복사되었습니다! 카카오톡 등에 붙여넣기 하세요.');
      }).catch(() => {
        alert('클립보드 복사에 실패했습니다.');
      });
    }
  };

  // API 카탈로그 + 사용자 등록 상품. API 실패 시 로컬 폴백
  const displayItems = useMemo(() => {
    const base =
      catalogItems.length > 0
        ? catalogItems
        : !isLoadingPrices
          ? GROCERY_ITEMS.map((i) => ({ ...i, source: 'local' as const }))
          : [];
    return [...customItems, ...base];
  }, [catalogItems, customItems, isLoadingPrices]);

  const filteredItems = useMemo(() => {
    return displayItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeTab === '전체'
          ? true
          : activeTab === '즐겨찾기'
            ? favorites.has(item.id)
            : item.category === activeTab;
      const matchesDeal =
        !dealsOnly || item.isDiscount === true || item.isPlusOne === true;
      return matchesSearch && matchesCategory && matchesDeal;
    });
  }, [displayItems, searchQuery, activeTab, favorites, dealsOnly]);

  const dealCount = useMemo(
    () => displayItems.filter((i) => i.isDiscount || i.isPlusOne).length,
    [displayItems]
  );

  const cartTotal = Array.from(cart.values()).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const cartItemCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);

  const regionLabel =
    regionCode === REGION_ALL
      ? '전국'
      : regions.find((r) => r.code === regionCode)?.name || '지역';

  return (
    <div className="grocery-app">
      <header className="grocery-header">
        <div className="grocery-header-title">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <div className="header-title-block">
            <h2>장보기</h2>
            <p className="header-subtitle">
              {isLoadingPrices ? (
                <span className="loading-inline">
                  <Loader2 size={12} className="spin" /> 참가격 불러오는 중…
                </span>
              ) : (
                <>
                  {regionLabel}
                  {inspectDay ? ` · ${inspectDay} 조사` : ''}
                  {catalogItems.length > 0 ? ` · ${catalogItems.length}개 상품` : ''}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setIsPresetModalOpen(true)}
            title="추천 식단 프리셋"
          >
            <Utensils size={24} />
          </button>
          <button
            className="icon-button"
            onClick={() => setViewMode((prev) => (prev === 'grid' ? 'list' : 'grid'))}
            title="보기 방식 변경"
          >
            {viewMode === 'grid' ? <ListIcon size={24} /> : <LayoutGrid size={24} />}
          </button>
          <button
            className="icon-button"
            onClick={() => setIsSavedListsModalOpen(true)}
            title="저장된 목록 보기"
          >
            <ClipboardList size={24} />
          </button>
          <button className="icon-button" onClick={() => setIsAddModalOpen(true)} title="나만의 물품 추가">
            <Camera size={24} />
          </button>
          <button className="icon-button cart-button" onClick={() => setIsCartOpen(true)}>
            <ShoppingCart size={24} />
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </button>
        </div>
      </header>

      <div className="filters-bar">
        <div className="region-select-wrap">
          <MapPin size={16} className="region-icon" />
          <select
            className="region-select"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            disabled={isLoadingPrices || isLocating}
            aria-label="지역 선택"
          >
            <option value="" disabled>지역을 선택해주세요</option>
            {regions.map((r) => (
              <option key={r.code} value={r.code}>
                {r.name}
              </option>
            ))}
          </select>
          <button 
            className="auto-locate-btn" 
            onClick={handleFindLocation} 
            disabled={isLocating}
            title="내 주변 현위치로 설정"
          >
            {isLocating ? '위치 찾는 중...' : '현위치 🎯'}
          </button>
        </div>
        <button
          type="button"
          className={`deals-toggle ${dealsOnly ? 'active' : ''}`}
          onClick={() => setDealsOnly((v) => !v)}
          title="할인·1+1만 보기"
        >
          <Tag size={14} />
          할인
          {dealCount > 0 && <span className="deals-count">{dealCount}</span>}
        </button>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="상품명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-tabs">
        <button
          className={`category-tab ${activeTab === '전체' ? 'active' : ''}`}
          onClick={() => setActiveTab('전체')}
        >
          전체
        </button>
        <button
          className={`category-tab ${activeTab === '즐겨찾기' ? 'active' : ''}`}
          onClick={() => setActiveTab('즐겨찾기')}
        >
          ♥ 즐겨찾기
        </button>
        {CATEGORIES.map((category) => (
          <button
            key={category}
            className={`category-tab ${activeTab === category ? 'active' : ''}`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grocery-content">
        {isLoadingPrices && (
          <div className="loading-state">
            <Loader2 size={36} className="spin" />
            <p>참가격 상품·가격을 불러오는 중입니다</p>
            <span>지역 매장 가격과 할인 정보를 수집합니다</span>
          </div>
        )}

        {!isLoadingPrices && loadError && catalogItems.length === 0 && (
          <div className="error-banner">
            <p>⚠️ {loadError}</p>
            <span>오프라인 기본 목록을 표시합니다.</span>
          </div>
        )}

        {!isLoadingPrices && (
          <div className={`grocery-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredItems.map((item) => {
              const cartItem = cart.get(item.id);
              const cartQuantity = cartItem?.quantity || 0;
              return (
                <GroceryCard
                  key={item.id}
                  item={item}
                  isFavorite={favorites.has(item.id)}
                  toggleFavorite={toggleFavorite}
                  onAddToCart={updateCart}
                  viewMode={viewMode}
                  cartQuantity={cartQuantity}
                />
              );
            })}
          </div>
        )}

        {!isLoadingPrices && filteredItems.length === 0 && catalogItems.length > 0 && (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <p>조건에 맞는 상품이 없습니다.</p>
          </div>
        )}
      </div>

      {cartItemCount > 0 && (
        <button className="floating-cart" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={24} />
          <div className="cart-badge">{cartItemCount}</div>
        </button>
      )}

      {isCartOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <h3>
                  <ShoppingCart size={24} /> 장바구니
                </h3>
                {cart.size > 0 && (
                  <button
                    className="clear-cart-btn"
                    onClick={() => setCart(new Map())}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline',
                    }}
                  >
                    전체 비우기
                  </button>
                )}
              </div>
              <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="cart-items">
              {Array.from(cart.values()).map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-icon">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="grocery-image-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">
                      {item.name}
                      {item.isDiscount && <span className="deal-badge sale inline">세일</span>}
                      {item.isPlusOne && <span className="deal-badge plusone inline">1+1</span>}
                    </h4>
                    <p className="cart-item-price">
                      {item.price.toLocaleString()}원 / {item.unit}
                    </p>
                  </div>
                  <div className="add-to-cart-controls" style={{ width: '100px' }}>
                    <button className="qty-btn" onClick={() => updateCart(item, -1)}>
                      <Minus size={16} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateCart(item, 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total-section">
              <div className="cart-total-row">
                <span className="cart-total-label">총 결제예상액</span>
                <span className="cart-total-value">{cartTotal.toLocaleString()}원</span>
              </div>
              <button className="checkout-btn" onClick={handleSaveList} disabled={cartItemCount === 0}>
                목록 저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {isSavedListsModalOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsSavedListsModalOpen(false)}>
          <div className="cart-modal saved-lists-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>
                <ClipboardList size={24} /> 저장된 장보기 목록
              </h3>
              <button className="close-btn" onClick={() => setIsSavedListsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="saved-lists-container">
              {savedLists.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={48} />
                  <p>저장된 장보기 목록이 없습니다.</p>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    장바구니에서 &apos;목록 저장하기&apos;를 눌러 추가해보세요!
                  </span>
                </div>
              ) : (
                savedLists.map((list) => (
                  <div key={list.id} className="saved-list-card" onClick={() => handleLoadList(list)}>
                    <div className="saved-list-info">
                      <h4>{list.name}</h4>
                      <p>
                        {list.items.length}개 물품 • 총 {list.total.toLocaleString()}원
                      </p>
                    </div>
                    <div className="saved-list-actions">
                      <button
                        className="action-btn share-btn"
                        onClick={(e) => handleShareList(list, e)}
                        title="목록 공유하기"
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={(e) => handleDeleteList(list.id, e)}
                        title="목록 삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="cart-modal add-item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>
                <Camera size={24} /> 나만의 물품 등록
              </h3>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="add-item-form">
              <div className="photo-upload-section">
                {newItemPhoto ? (
                  <div className="photo-preview-container">
                    <img src={newItemPhoto} alt="미리보기" className="photo-preview" />
                    <button className="photo-remove-btn" onClick={() => setNewItemPhoto(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="photo-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoUpload}
                      hidden
                    />
                    <div className="photo-upload-placeholder">
                      <Camera size={32} />
                      <span>사진 찍기 / 업로드</span>
                    </div>
                  </label>
                )}
              </div>

              <div className="form-group">
                <label>상품명</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="예: 시골에서 보내준 참기름"
                  />
                  {isOcrLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#84cc16',
                        fontSize: '12px',
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                    >
                      <Loader2 size={14} className="spin" />
                      <span>텍스트 인식 중...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>단위</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="예: 1병"
                  />
                </div>
                <div className="form-group">
                  <label>가격 (원)</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="예: 15000"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>카테고리</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as Category)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="checkout-btn add-submit-btn"
                onClick={handleAddCustomItem}
                disabled={!newItemName || !newItemPrice}
              >
                리스트에 추가하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 프리셋 모달 */}
      {isPresetModalOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsPresetModalOpen(false)}>
          <div className="cart-modal preset-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h2>추천 식단 프리셋 🍳</h2>
              <button className="icon-button" onClick={() => setIsPresetModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="preset-list">
              {presets.map((preset) => (
                <div key={preset.id} className="preset-card">
                  <div className="preset-info">
                    <h3>{preset.name}</h3>
                    <p className="preset-ingredients">{preset.ingredients.join(', ')}</p>
                  </div>
                  <div className="preset-actions">
                    <button 
                      className="preset-add-btn"
                      onClick={() => handleAddPresetToCart(preset)}
                    >
                      장바구니 일괄 담기
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="preset-help">식단 재료명과 유사한 상품을 장바구니에 자동으로 담아줍니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
