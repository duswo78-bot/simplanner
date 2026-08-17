import React, { useState } from 'react';
import {
  ChevronLeft,
  Home,
  CreditCard,
  Send,
  PieChart,
  Settings as SettingsIcon,
} from 'lucide-react';
import './Finance.css';

import { useFinanceStore } from './FinanceStore';
import { HomePage } from './pages/HomePage';
import { CardPage } from './pages/CardPage';
import { TransferPage } from './pages/TransferPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { SettingsPage } from './pages/SettingsPage';

interface FinanceAppProps {
  onBack: () => void;
}

type Page = 'home' | 'cards' | 'transfer' | 'analysis' | 'settings';

const PAGE_TITLES: Record<Page, string> = {
  home: '내 카드 비서',
  cards: '내 카드',
  transfer: '자동이체',
  analysis: '소비 분석',
  settings: '설정',
};

export function FinanceApp({ onBack }: FinanceAppProps) {
  const [page, setPage] = useState<Page>('home');
  const store = useFinanceStore();

  const handleNavigate = (target: string) => {
    setPage(target as Page);
  };

  const handleBack = () => {
    if (page !== 'home') {
      setPage('home');
    } else {
      onBack();
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage store={store} onNavigate={handleNavigate} />;
      case 'cards':
        return <CardPage store={store} />;
      case 'transfer':
        return <TransferPage store={store} />;
      case 'analysis':
        return <AnalysisPage store={store} />;
      case 'settings':
        return <SettingsPage store={store} />;
      default:
        return null;
    }
  };

  return (
    <div className={`finance-app ${!store.settings.darkMode ? 'finance-light-mode' : ''}`}>
      {/* Header */}
      <header className="finance-header">
        <button className="finance-icon-btn" onClick={handleBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>{PAGE_TITLES[page]}</h1>
        <div className="finance-header-right">
          <div style={{ width: 40 }} />
        </div>
      </header>

      {/* Content */}
      <div className="finance-content">
        <div className="finance-page" key={page}>
          {renderPage()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="finance-bottom-nav">
        <button
          className={`finance-nav-item ${page === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigate('home')}
        >
          <Home size={22} />
          <span className="finance-nav-label">홈</span>
        </button>
        <button
          className={`finance-nav-item ${page === 'cards' ? 'active' : ''}`}
          onClick={() => handleNavigate('cards')}
        >
          <CreditCard size={22} />
          <span className="finance-nav-label">내 카드</span>
        </button>
        <button
          className={`finance-nav-item ${page === 'transfer' ? 'active' : ''}`}
          onClick={() => handleNavigate('transfer')}
        >
          <Send size={22} />
          <span className="finance-nav-label">자동이체</span>
        </button>
        <button
          className={`finance-nav-item ${page === 'analysis' ? 'active' : ''}`}
          onClick={() => handleNavigate('analysis')}
        >
          <PieChart size={22} />
          <span className="finance-nav-label">분석</span>
        </button>
        <button
          className={`finance-nav-item ${page === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavigate('settings')}
        >
          <SettingsIcon size={22} />
          <span className="finance-nav-label">설정</span>
        </button>
      </nav>
    </div>
  );
}
