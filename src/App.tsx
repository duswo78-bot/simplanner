import React, { useState } from 'react';
import { MobileContainer } from './components/MobileContainer';
import { Launcher } from './components/Launcher';
import type { AppData } from './components/AppIcon';
import { ErrorBoundary } from './components/ErrorBoundary';

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

  const handleAppClick = (app: AppData) => {
    setOpenApps(prev => {
      if (!prev.find(a => a.id === app.id)) {
        return [...prev, app];
      }
      return prev;
    });
    setCurrentApp(app);
  };

  const handleBack = () => {
    setCurrentApp(null);
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
      default:
        return <EmptyApp title={app.name} onBack={handleBack} />;
    }
  };

  return (
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
  );
}

export default App;
