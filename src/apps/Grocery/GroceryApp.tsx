import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Search, ShoppingCart, Heart, Minus, Plus, X, Camera, ClipboardList, Share2, Loader2, LayoutGrid, List as ListIcon, Trash2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { GROCERY_ITEMS } from './groceryData';
import type { GroceryItem, Category } from './groceryData';
import { fetchGroceryPrices } from './api';
import type { ApiPriceInfo } from './api';
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

function GroceryCard({ 
  item, 
  isFavorite, 
  toggleFavorite, 
  onAddToCart,
  viewMode,
  cartQuantity
}: { 
  item: GroceryItem; 
  isFavorite: boolean; 
  toggleFavorite: (id: string) => void; 
  onAddToCart: (item: GroceryItem, qty: number) => void;
  viewMode: 'grid' | 'list';
  cartQuantity: number;
}) {
  return (
    <div className="grocery-card">
      <button 
        className={`favorite-btn ${isFavorite ? 'active' : ''}`}
        onClick={() => toggleFavorite(item.id)}
      >
        <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      
      <div className="grocery-icon">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="grocery-image-preview" />
        ) : (
          item.icon
        )}
      </div>
      
      {viewMode === 'grid' ? (
        <>
          <div className="grocery-info">
            <div className="grocery-title-row">
              <h3 className="grocery-name">{item.name}</h3>
              <div className="grocery-price-box">
                <p className="grocery-price">{item.price.toLocaleString()}원</p>
                <p className="grocery-unit">/{item.unit}</p>
              </div>
            </div>
            {(item.storeName || item.inspectDay || item.manufacturer) && (
              <div className="grocery-details">
                {item.storeName && <span>🏪 {item.storeName}</span>}
                {item.manufacturer && <span>🏢 {item.manufacturer}</span>}
                {item.inspectDay && <span>📅 {item.inspectDay} 기준</span>}
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
            {(item.storeName || item.inspectDay || item.manufacturer) && (
              <div className="grocery-details">
                {item.storeName && <span>🏪 {item.storeName}</span>}
                {item.manufacturer && <span>🏢 {item.manufacturer}</span>}
                {item.inspectDay && <span>📅 {item.inspectDay} 기준</span>}
              </div>
            )}
          </div>
          
          <div className="grocery-action-area">
            <div className="grocery-price-box">
              <p className="grocery-price">{item.price.toLocaleString()}원</p>
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [livePrices, setLivePrices] = useState<Map<string, ApiPriceInfo>>(new Map());
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);

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

  // Load saved lists from localStorage on mount
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

  // Save saved lists to localStorage when they change
  useEffect(() => {
    localStorage.setItem('grocery_saved_lists', JSON.stringify(savedLists));
  }, [savedLists]);

  useEffect(() => {
    async function loadPrices() {
      setIsLoadingPrices(true);
      const pricesMap = await fetchGroceryPrices();
      setLivePrices(pricesMap);
      setIsLoadingPrices(false);
    }
    loadPrices();
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateCart = (item: GroceryItem, delta: number) => {
    setCart(prev => {
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
      setNewItemPhoto(URL.createObjectURL(file));
      
      // OCR Processing
      setIsOcrLoading(true);
      try {
        const result = await Tesseract.recognize(file, 'kor');
        const text = result.data.text.trim();
        if (text) {
          // Extract the first meaningful line
          const firstLine = text.split('\n').map(l => l.trim()).filter(l => l.length > 1)[0];
          if (firstLine) {
            setNewItemName(firstLine);
          }
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
      imageUrl: newItemPhoto || undefined
    };

    setCustomItems(prev => [newItem, ...prev]);
    setIsAddModalOpen(false);
    
    // Reset form
    setNewItemName('');
    setNewItemPrice('');
    setNewItemUnit('1개');
    setNewItemCategory('기타');
    setNewItemPhoto(null);
  };

  const handleSaveList = () => {
    if (cart.size === 0) return;
    
    const dateStr = new Date().toLocaleString('ko-KR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const newList: SavedList = {
      id: `list_${Date.now()}`,
      date: new Date().toISOString(),
      name: `${dateStr} 장보기 목록`,
      items: Array.from(cart.values()),
      total: Array.from(cart.values()).reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    setSavedLists(prev => [newList, ...prev]);
    setCart(new Map()); // clear cart after saving
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
    list.items.forEach(item => {
      newCart.set(item.id, item);
    });
    setCart(newCart);
    setIsSavedListsModalOpen(false);
    setIsCartOpen(true);
  };

  const handleDeleteList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 목록을 삭제하시겠습니까?')) {
      setSavedLists(prev => prev.filter(l => l.id !== id));
    }
  };

  const handleShareList = async (list: SavedList, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = `🛒 ${list.name}\n\n`;
    list.items.forEach(item => {
      text += `- ${item.name} (${item.quantity}개): ${(item.price * item.quantity).toLocaleString()}원\n`;
    });
    text += `\n💰 총 예상액: ${list.total.toLocaleString()}원`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: list.name,
          text: text,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('목록 내용이 클립보드에 복사되었습니다! 카카오톡 등에 붙여넣기 하세요.');
    }
  };

  const itemsWithLivePrices = useMemo(() => {
    const baseItems = GROCERY_ITEMS.map(item => {
      let newItem = { ...item };
      for (const [apiName, apiInfo] of livePrices.entries()) {
        if (apiName.includes(item.name) || item.name.includes(apiName)) {
          newItem.price = apiInfo.price;
          if (apiInfo.inspectDay) newItem.inspectDay = apiInfo.inspectDay;
          if (apiInfo.storeName) newItem.storeName = apiInfo.storeName;
          if (apiInfo.manufacturer) newItem.manufacturer = apiInfo.manufacturer;
          break;
        }
      }
      return newItem;
    });
    return [...customItems, ...baseItems];
  }, [livePrices, customItems]);

  const filteredItems = useMemo(() => {
    return itemsWithLivePrices.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = 
        activeTab === '전체' ? true :
        activeTab === '즐겨찾기' ? favorites.has(item.id) :
        item.category === activeTab;
      
      return matchesSearch && matchesCategory;
    });
  }, [itemsWithLivePrices, searchQuery, activeTab, favorites]);

  const cartTotal = Array.from(cart.values()).reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = Array.from(cart.values()).reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="grocery-app">
      {/* Header */}
      <header className="grocery-header">
        <div className="grocery-header-title">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h2>장보기 {isLoadingPrices && <span style={{fontSize: '12px', color: '#64748b', fontWeight: 'normal'}}>(실시간 물가 불러오는 중...)</span>}</h2>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')} title="보기 방식 변경">
            {viewMode === 'grid' ? <ListIcon size={24} /> : <LayoutGrid size={24} />}
          </button>
          <button className="icon-button" onClick={() => setIsSavedListsModalOpen(true)} title="저장된 목록 보기">
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

      {/* Search */}
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

      {/* Category Tabs */}
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
        {CATEGORIES.map(category => (
          <button 
            key={category}
            className={`category-tab ${activeTab === category ? 'active' : ''}`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grocery-content">
        <div className={`grocery-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
          {filteredItems.map(item => {
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
        
        {filteredItems.length === 0 && (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <p>조건에 맞는 상품이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <button className="floating-cart" onClick={() => setIsCartOpen(true)}>
          <ShoppingCart size={24} />
          <div className="cart-badge">{cartItemCount}</div>
        </button>
      )}

      {/* Cart Modal */}
      {isCartOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div className="cart-modal" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <div style={{display: 'flex', alignItems: 'baseline', gap: '12px'}}>
                <h3><ShoppingCart size={24} /> 장바구니</h3>
                {cart.size > 0 && (
                  <button 
                    className="clear-cart-btn" 
                    onClick={() => setCart(new Map())} 
                    style={{background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', cursor: 'pointer', padding: 0, textDecoration: 'underline'}}
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
              {Array.from(cart.values()).map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-icon">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="grocery-image-preview" />
                    ) : (
                      item.icon
                    )}
                  </div>
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{item.name}</h4>
                    <p className="cart-item-price">{item.price.toLocaleString()}원 / {item.unit}</p>
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

      {/* Saved Lists Modal */}
      {isSavedListsModalOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsSavedListsModalOpen(false)}>
          <div className="cart-modal saved-lists-modal" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3><ClipboardList size={24} /> 저장된 장보기 목록</h3>
              <button className="close-btn" onClick={() => setIsSavedListsModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="saved-lists-container">
              {savedLists.length === 0 ? (
                <div className="empty-state">
                  <ClipboardList size={48} />
                  <p>저장된 장보기 목록이 없습니다.</p>
                  <span style={{fontSize: '13px', color: '#94a3b8'}}>장바구니에서 '목록 저장하기'를 눌러 추가해보세요!</span>
                </div>
              ) : (
                savedLists.map(list => (
                  <div key={list.id} className="saved-list-card" onClick={() => handleLoadList(list)}>
                    <div className="saved-list-info">
                      <h4>{list.name}</h4>
                      <p>{list.items.length}개 물품 • 총 {list.total.toLocaleString()}원</p>
                    </div>
                    <div className="saved-list-actions">
                      <button className="action-btn share-btn" onClick={(e) => handleShareList(list, e)} title="목록 공유하기">
                        <Share2 size={18} />
                      </button>
                      <button className="action-btn delete-btn" onClick={(e) => handleDeleteList(list.id, e)} title="목록 삭제">
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

      {/* Add Custom Item Modal */}
      {isAddModalOpen && (
        <div className="cart-modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="cart-modal add-item-modal" onClick={e => e.stopPropagation()}>
            <div className="cart-header">
              <h3><Camera size={24} /> 나만의 물품 등록</h3>
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
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} hidden />
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
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="예: 시골에서 보내준 참기름" />
                  {isOcrLoading && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px', color: '#84cc16', fontSize: '12px', background: 'white', padding: '2px 4px', borderRadius: '4px' }}>
                      <Loader2 size={14} className="spin" />
                      <span>텍스트 인식 중...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>단위</label>
                  <input type="text" value={newItemUnit} onChange={e => setNewItemUnit(e.target.value)} placeholder="예: 1병" />
                </div>
                <div className="form-group">
                  <label>가격 (원)</label>
                  <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} placeholder="예: 15000" />
                </div>
              </div>

              <div className="form-group">
                <label>카테고리</label>
                <select value={newItemCategory} onChange={e => setNewItemCategory(e.target.value as Category)}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <button className="checkout-btn add-submit-btn" onClick={handleAddCustomItem} disabled={!newItemName || !newItemPrice}>
                리스트에 추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
