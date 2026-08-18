import { useState, useEffect } from 'react';
import { Home, Package, Star, Clock, Settings, Plus, ChevronLeft, Store } from 'lucide-react';
import { useParcelStore } from './ParcelStore';
import { HomePage } from './pages/HomePage';
import { AllPage } from './pages/AllPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentPage } from './pages/RecentPage';
import { SettingsPage } from './pages/SettingsPage';
import { ParcelFormModal } from './components/ParcelFormModal';
import { CvsSendModal } from './components/CvsSendModal';
import { TrackingWebView } from './components/TrackingWebView';
import './ParcelApp.css';

interface ParcelAppProps {
  onBack: () => void;
}

type Page = 'home' | 'all' | 'favorites' | 'recent' | 'settings';

const PAGE_TITLES: Record<Page, string> = {
  home: '택배 조회',
  all: '전체 목록',
  favorites: '즐겨찾기',
  recent: '최근 조회',
  settings: '설정',
};

export function ParcelApp({ onBack }: ParcelAppProps) {
  const [page, setPage] = useState<Page>('home');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCvsOpen, setIsCvsOpen] = useState(false);
  const [viewingParcelId, setViewingParcelId] = useState<string | null>(null);
  const [editingParcelId, setEditingParcelId] = useState<string | null>(null);
  
  const store = useParcelStore();

  useEffect(() => {
    store.syncStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editingParcel = editingParcelId
    ? store.parcels.find((p) => p.id === editingParcelId) || null
    : null;

  const handleView = (id: string) => {
    store.markViewed(id);
    setViewingParcelId(id);
  };

  const handleEdit = (id: string) => {
    setEditingParcelId(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage store={store} onView={handleView} onEdit={handleEdit} />;
      case 'all':
        return <AllPage store={store} onView={handleView} onEdit={handleEdit} />;
      case 'favorites':
        return <FavoritesPage store={store} onView={handleView} onEdit={handleEdit} />;
      case 'recent':
        return <RecentPage store={store} onView={handleView} onEdit={handleEdit} />;
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return <HomePage store={store} onView={handleView} onEdit={handleEdit} />;
    }
  };

  return (
    <div className="parcel-app">
      {/* Header */}
      <header className="pc-header">
        <button className="pc-icon-btn" onClick={onBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>{PAGE_TITLES[page]}</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Content */}
      <div className="pc-content">
        <div className="pc-page" key={page}>
          {renderPage()}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="pc-bottom-nav">
        <button className={`pc-nav-item ${page === 'home' ? 'active' : ''}`} onClick={() => setPage('home')}>
          <Home size={22} />
          <span className="pc-nav-label">홈</span>
        </button>
        <button className={`pc-nav-item ${page === 'all' ? 'active' : ''}`} onClick={() => setPage('all')}>
          <Package size={22} />
          <span className="pc-nav-label">전체</span>
        </button>
        <button className={`pc-nav-item ${page === 'favorites' ? 'active' : ''}`} onClick={() => setPage('favorites')}>
          <Star size={22} />
          <span className="pc-nav-label">즐겨찾기</span>
        </button>
        <button className={`pc-nav-item ${page === 'recent' ? 'active' : ''}`} onClick={() => setPage('recent')}>
          <Clock size={22} />
          <span className="pc-nav-label">최근조회</span>
        </button>
        <button className={`pc-nav-item ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>
          <Settings size={22} />
          <span className="pc-nav-label">설정</span>
        </button>
      </nav>

      {/* 편의점 택배 FAB (왼쪽) */}
      <button
        type="button"
        className="pc-fab-cvs"
        onClick={() => setIsCvsOpen(true)}
        aria-label="편의점 택배 보내기"
      >
        <Store size={16} />
        <span>편의점 택배</span>
      </button>

      {/* 조회 등록 FAB (오른쪽) */}
      <button className="pc-fab" onClick={() => setIsAddOpen(true)} aria-label="택배 조회 등록">
        <Plus size={28} />
      </button>

      {/* Modals */}
      {isAddOpen && (
        <ParcelFormModal store={store} onClose={(newId) => {
          setIsAddOpen(false);
          if (newId) handleView(newId);
        }} />
      )}
      {editingParcel && (
        <ParcelFormModal
          store={store}
          editParcel={editingParcel}
          onClose={(newId) => {
            setEditingParcelId(null);
            if (newId) handleView(newId);
          }}
        />
      )}
      {isCvsOpen && <CvsSendModal store={store} onClose={() => setIsCvsOpen(false)} />}
      {viewingParcelId && <TrackingWebView store={store} parcelId={viewingParcelId} onClose={() => setViewingParcelId(null)} />}
    </div>
  );
}
