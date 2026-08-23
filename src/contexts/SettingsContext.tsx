import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface AppSettings {
  hiddenApps: string[];
  locationMode: 'gps' | 'fixed';
  fixedLocation: { lat: number; lng: number; city: string };
  notifications: boolean;
  sounds: boolean;
}

const defaultSettings: AppSettings = {
  hiddenApps: [],
  locationMode: 'gps',
  fixedLocation: { lat: 37.566, lng: 126.978, city: '서울' },
  notifications: true,
  sounds: true,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem('simplanner_settings');
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem('simplanner_settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
