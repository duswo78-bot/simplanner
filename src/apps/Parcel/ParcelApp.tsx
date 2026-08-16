import React, { useState } from 'react';
import { Home, Package, Star, Clock, Settings, Plus, ChevronLeft } from 'lucide-react';
import { useParcelStore } from './ParcelStore';
import { HomePage } from './pages/HomePage';
import { AllPage } from './pages/AllPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { RecentPage } from './pages/RecentPage';
import { SettingsPage } from './pages/SettingsPage';
import { ParcelFormModal } from './components/ParcelFormModal';
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
  const [viewingParcelId, setViewingParcelId] = useState<string | null>(null);
  
  const store = useParcelStore();

  const handleView = (id: string) => {
    store.markViewed(id);
    setViewingParcelId(id);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage store={store} onView={handleView} />;
      case 'all':
        return <AllPage store={store} onView={handleView} />;
      case 'favorites':
        return <FavoritesPage store={store} onView={handleView} />;
      case 'recent':
        return <RecentPage store={store} onView={handleView} />;
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return <HomePage store={store} onView={handleView} />;
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

      {/* FAB */}
      <button className="pc-fab" onClick={() => setIsAddOpen(true)}>
        <Plus size={28} />
      </button>

      {/* Modals */}
      {isAddOpen && <ParcelFormModal store={store} onClose={() => setIsAddOpen(false)} />}
      {viewingParcelId && <TrackingWebView store={store} parcelId={viewingParcelId} onClose={() => setViewingParcelId(null)} />}
    </div>
  );
}
