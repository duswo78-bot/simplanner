import React, { useState } from 'react';
import { MobileContainer } from './components/MobileContainer';
import { Launcher } from './components/Launcher';
import type { AppData } from './components/AppIcon';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';

// Apps
import { MealApp } from './apps/MealApp';
import { PharmacyApp } from './apps/PharmacyApp';
import { BusApp } from './apps/BusApp';
import { EmptyApp } from './apps/EmptyApp';
import { SchoolApp } from './apps/School/SchoolApp';
import { PlannerApp } from './apps/Planner/PlannerApp';
import { CalculatorApp } from './apps/CalculatorApp';
import { GroceryApp } from './apps/Grocery/GroceryApp';
import { AccountBookApp } from './apps/AccountBook/AccountBookApp';
import { RestaurantApp } from './apps/Restaurant/RestaurantApp';
import { HealthApp } from './apps/Health/HealthApp';
import { CarLedgerApp } from './apps/CarLedger/CarLedgerApp';
import { ParcelApp } from './apps/Parcel/ParcelApp';
import { FinanceApp } from './apps/Finance/FinanceApp';
import { TimerApp } from './apps/Timer/TimerApp';
import { RouletteApp } from './apps/Roulette/RouletteApp';
import { SettingsApp } from './apps/Settings/SettingsApp';
import { soundManager } from './utils/SoundManager';

function App() {
  const [currentApp, setCurrentApp] = useState<AppData | null>(() => {
    if (window.location.hash === '#routing') {
      return { id: 'app-bus', name: '대중교통', icon: 'Bus', color: '' };
    }
    return null;
  });

  const [openApps, setOpenApps] = useState<AppData[]>(() => {
    if (window.location.hash === '#routing') {
      return [{ id: 'app-bus', name: '대중교통', icon: 'Bus', color: '' }];
    }
    return [];
  });

  React.useEffect(() => {
    const handlePopState = () => {
      if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#routing') {
        setCurrentApp(null);
      }
    };
    
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest('button') || target.closest('a') || target.closest('.clickable') || target.closest('.app-icon-container');
      if (isClickable) {
        soundManager.playTick();
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  const handleAppClick = (app: AppData) => {
    if (window.location.hash !== `#${app.id}`) {
      window.history.pushState(null, '', `#${app.id}`);
    }
    setOpenApps(prev => {
      if (!prev.find(a => a.id === app.id)) {
        return [...prev, app];
      }
      return prev;
    });
    setCurrentApp(app);
  };

  const handleBack = () => {
    if (window.location.hash && window.location.hash !== '#routing') {
      window.history.back();
    } else {
      setCurrentApp(null);
    }
  };

  const renderAppContent = (app: AppData) => {
    switch (app.id) {
      case 'app-planner':
        return <PlannerApp onBack={handleBack} />;
      case 'app-meals':
        return <MealApp onBack={handleBack} />;
      case 'app-pharmacy':
        return <PharmacyApp onBack={handleBack} />;
      case 'app-bus':
        return <BusApp onBack={handleBack} />;
      case 'app-calculator':
        return <CalculatorApp onBack={handleBack} />;
      case 'app-school':
        return <SchoolApp onBack={handleBack} />;
      case 'app-cart':
        return <GroceryApp onBack={handleBack} />;
      case 'app-account':
        return <AccountBookApp onBack={handleBack} />;
      case 'app-restaurant':
        return <RestaurantApp onBack={handleBack} />;
      case 'app-health':
        return <HealthApp onBack={handleBack} />;
      case 'app-car':
        return <CarLedgerApp onBack={handleBack} />;
      case 'app-delivery':
        return <ParcelApp onBack={handleBack} />;
      case 'app-card':
        return <FinanceApp onBack={handleBack} />;
      case 'app-timer':
        return <TimerApp onBack={handleBack} />;
      case 'app-roulette':
        return <RouletteApp onBack={handleBack} />;
      case 'app-settings':
        return <SettingsApp onBack={handleBack} />;
      default:
        return <EmptyApp title={app.name} onBack={handleBack} />;
    }
  };

  return (
    <SettingsProvider>
      <MobileContainer>
        <ErrorBoundary>
          <div style={{ display: currentApp ? 'none' : 'block', height: '100%', width: '100%' }}>
            <Launcher onAppClick={handleAppClick} />
          </div>
          
          {openApps.map(app => (
            <div 
              key={app.id} 
              style={{ 
                display: currentApp?.id === app.id ? 'block' : 'none',
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: currentApp?.id === app.id ? 10 : -1,
                backgroundColor: '#020617'
              }}
            >
              {renderAppContent(app)}
            </div>
          ))}
        </ErrorBoundary>
      </MobileContainer>
    </SettingsProvider>
  );
}

export default App;
