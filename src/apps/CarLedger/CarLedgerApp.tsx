import React, { useState } from 'react';
import {
  ChevronLeft,
  Home,
  Car as CarIcon,
  Fuel,
  Wrench,
  BarChart3,
  Plus,
  Route,
  DollarSign,
  Settings,
  Calendar,
} from 'lucide-react';
import { useCarLedgerStore } from './CarLedgerStore';
import { HomePage } from './pages/HomePage';
import { DrivePage } from './pages/DrivePage';
import { FuelPage } from './pages/FuelPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { StatsPage } from './pages/StatsPage';
import { CalendarPage } from './pages/CalendarPage';
import { VehiclePage } from './pages/VehiclePage';
import { ExpensePage } from './pages/ExpensePage';
import './CarLedger.css';

interface CarLedgerAppProps {
  onBack: () => void;
}

type Page = 'home' | 'drive' | 'fuel' | 'maintenance' | 'stats' | 'calendar' | 'vehicle' | 'expense';

const PAGE_TITLES: Record<Page, string> = {
  home: '차량 관리',
  drive: '주행 기록',
  fuel: '주유 기록',
  maintenance: '정비 기록',
  stats: '통계',
  calendar: '캘린더',
  vehicle: '차량 정보',
  expense: '경비 관리',
};

export function CarLedgerApp({ onBack }: CarLedgerAppProps) {
  const [page, setPage] = useState<Page>('home');
  const [fabOpen, setFabOpen] = useState(false);
  const store = useCarLedgerStore();

  const handleNavigate = (target: string) => {
    setPage(target as Page);
    setFabOpen(false);
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
      case 'drive':
        return <DrivePage store={store} />;
      case 'fuel':
        return <FuelPage store={store} />;
      case 'maintenance':
        return <MaintenancePage store={store} />;
      case 'stats':
        return <StatsPage store={store} />;
      case 'calendar':
        return <CalendarPage store={store} />;
      case 'vehicle':
        return <VehiclePage store={store} />;
      case 'expense':
        return <ExpensePage store={store} />;
      default:
        return <HomePage store={store} onNavigate={handleNavigate} />;
    }
  };

  const fabActions = [
    { id: 'drive', label: '주행 기록', icon: <Route size={20} />, bg: '#2563eb' },
    { id: 'fuel', label: '주유 기록', icon: <Fuel size={20} />, bg: '#16a34a' },
    { id: 'maintenance', label: '정비 기록', icon: <Wrench size={20} />, bg: '#d97706' },
    { id: 'expense', label: '경비 기록', icon: <DollarSign size={20} />, bg: '#7c3aed' },
  ];

  return (
    <div className="car-ledger-app">
      {/* Header */}
      <header className="cl-header">
        <button className="cl-icon-btn" onClick={handleBack}>
          <ChevronLeft size={24} />
        </button>
        <h1>{PAGE_TITLES[page]}</h1>
        <div className="cl-header-right">
          {page === 'home' && (
            <>
              <button className="cl-icon-btn" onClick={() => setPage('calendar')}>
                <Calendar size={20} />
              </button>
              <button className="cl-icon-btn" onClick={() => setPage('vehicle')}>
                <Settings size={20} />
              </button>
            </>
          )}
          {page !== 'home' && <div style={{ width: 40 }} />}
        </div>
      </header>

      {/* Page Content */}
      <div className="cl-content">
        <div className="cl-page" key={page}>
          {renderPage()}
        </div>
      </div>

      {/* FAB Overlay */}
      {fabOpen && (
        <div className="cl-fab-overlay" onClick={() => setFabOpen(false)} />
      )}

      {/* FAB Menu */}
      {fabOpen && (
        <div className="cl-fab-menu">
          {fabActions.map((action, i) => (
            <div
              key={action.id}
              className="cl-fab-option"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <button
                className="cl-fab-option-btn"
                style={{ background: action.bg }}
                onClick={() => handleNavigate(action.id)}
              >
                {action.icon}
              </button>
              <span className="cl-fab-option-label">{action.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className={`cl-fab ${fabOpen ? 'open' : ''}`}
        onClick={() => setFabOpen(prev => !prev)}
      >
        <Plus size={26} />
      </button>

      {/* Bottom Navigation */}
      <nav className="cl-bottom-nav">
        <button
          className={`cl-nav-item ${page === 'home' ? 'active' : ''}`}
          onClick={() => setPage('home')}
        >
          <Home size={22} />
          <span className="cl-nav-label">홈</span>
        </button>
        <button
          className={`cl-nav-item ${page === 'drive' ? 'active' : ''}`}
          onClick={() => setPage('drive')}
        >
          <Route size={22} />
          <span className="cl-nav-label">주행</span>
        </button>
        <button
          className={`cl-nav-item ${page === 'fuel' ? 'active' : ''}`}
          onClick={() => setPage('fuel')}
        >
          <Fuel size={22} />
          <span className="cl-nav-label">주유</span>
        </button>
        <button
          className={`cl-nav-item ${page === 'maintenance' ? 'active' : ''}`}
          onClick={() => setPage('maintenance')}
        >
          <Wrench size={22} />
          <span className="cl-nav-label">정비</span>
        </button>
        <button
          className={`cl-nav-item ${page === 'stats' ? 'active' : ''}`}
          onClick={() => setPage('stats')}
        >
          <BarChart3 size={22} />
          <span className="cl-nav-label">통계</span>
        </button>
      </nav>
    </div>
  );
}
