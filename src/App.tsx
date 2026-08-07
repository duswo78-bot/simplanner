import React, { useState } from 'react';
import { MobileContainer } from './components/MobileContainer';
import { Launcher } from './components/Launcher';
import type { AppData } from './components/AppIcon';
import { ErrorBoundary } from './components/ErrorBoundary';

// Apps
import { MealApp } from './apps/MealApp';
import { PharmacyApp } from './apps/PharmacyApp';
import { BusApp } from './apps/BusApp';
import { RoutingApp } from './apps/RoutingApp';
import { EmptyApp } from './apps/EmptyApp';

function App() {
  const [currentApp, setCurrentApp] = useState<AppData | null>(() => {
    if (window.location.hash === '#routing') {
      return { id: 'app-bus', name: '대중교통', icon: 'Bus', color: '' };
    }
    return null;
  });

  const handleBack = () => {
    setCurrentApp(null);
  };

  const renderCurrentApp = () => {
    if (!currentApp) return <Launcher onAppClick={setCurrentApp} />;

    switch (currentApp.id) {
      case 'app-meals':
        return <MealApp onBack={handleBack} />;
      case 'app-pharmacy':
        return <PharmacyApp onBack={handleBack} />;
      case 'app-bus':
        return <BusApp onBack={handleBack} />;
      default:
        return <EmptyApp title={currentApp.name} onBack={handleBack} />;
    }
  };

  return (
    <MobileContainer>
      <ErrorBoundary>
        {renderCurrentApp()}
      </ErrorBoundary>
    </MobileContainer>
  );
}

export default App;
