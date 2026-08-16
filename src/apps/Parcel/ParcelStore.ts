import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Constants & Types ──────────────────────────────────────────────────────

export interface Carrier {
  id: string;
  name: string;
  type: 'domestic' | 'international';
  detectPattern?: RegExp;
}

export const CARRIERS: Carrier[] = [
  // Domestic
  { id: 'kr.cjlogistics', name: 'CJ대한통운', type: 'domestic', detectPattern: /^\d{10,12}$/ },
  { id: 'kr.hanjin', name: '한진택배', type: 'domestic', detectPattern: /^\d{10,12}$/ },
  { id: 'kr.lotte', name: '롯데택배', type: 'domestic', detectPattern: /^\d{10,12}$/ },
  { id: 'kr.epost', name: '우체국택배', type: 'domestic', detectPattern: /^\d{13}$/ },
  { id: 'kr.logen', name: '로젠택배', type: 'domestic', detectPattern: /^\d{11}$/ },
  { id: 'kr.kdexp', name: '경동택배', type: 'domestic', detectPattern: /^\d{11,13}$/ },
  { id: 'kr.daesin', name: '대신택배', type: 'domestic', detectPattern: /^\d{13}$/ },
  { id: 'kr.chunilps', name: '천일택배', type: 'domestic' },
  { id: 'kr.ilyanglogis', name: '일양로지스', type: 'domestic' },
  { id: 'kr.hdexp', name: '합동택배', type: 'domestic' },
  { id: 'kr.cupost', name: 'CU 편의점택배', type: 'domestic' },
  { id: 'kr.cvsnet', name: 'GS Postbox', type: 'domestic' },
  { id: 'kr.homepick', name: '홈픽', type: 'domestic' },
  // International
  { id: 'un.dhl', name: 'DHL', type: 'international' },
  { id: 'un.ups', name: 'UPS', type: 'international', detectPattern: /^1Z[A-Z0-9]{16}$/ },
  { id: 'un.fedex', name: 'FedEx', type: 'international', detectPattern: /^\d{12,15}$/ },
  { id: 'un.ems', name: 'EMS', type: 'international', detectPattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/ },
  { id: 'un.usps', name: 'USPS', type: 'international', detectPattern: /^\d{20,22}$/ },
  { id: 'cn.chinapost', name: 'China Post', type: 'international' },
  { id: 'cn.cainiao', name: 'Cainiao', type: 'international' },
  { id: 'cn.yanwen', name: 'Yanwen', type: 'international' },
  { id: 'cn.4px', name: '4PX', type: 'international' },
  { id: 'cn.sfexpress', name: 'SF Express', type: 'international' },
  { id: 'cn.yunexpress', name: 'YunExpress', type: 'international' },
  { id: 'un.ecms', name: 'ECMS', type: 'international' },
];

export const getCarrierName = (id: string) => CARRIERS.find(c => c.id === id)?.name || '알 수 없음';

export const detectCarrier = (trackingNumber: string): Carrier | null => {
  const cleanNumber = trackingNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // Specific rigid matches first
  if (cleanNumber.startsWith('1Z')) return CARRIERS.find(c => c.id === 'un.ups') || null;
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'un.ems') || null;
  if (cleanNumber.length === 13 && /^\d{13}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'kr.epost') || null; // Epost heavily uses 13 digits
  if (cleanNumber.length === 11 && /^\d{11}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'kr.logen') || null;
  
  // Generic 10-12 digits usually CJ/Hanjin/Lotte in Korea
  if (/^\d{10,12}$/.test(cleanNumber)) {
    return CARRIERS.find(c => c.id === 'kr.cjlogistics') || null; // Default to CJ
  }

  return null; // Force manual selection if unclear
};

export type ParcelStatus = '준비' | '배송중' | '오늘도착' | '완료';

export interface ParcelRecord {
  id: string;
  name: string;
  trackingNumber: string;
  carrierId: string;
  shop: string;
  memo: string;
  tags: string[];
  status: ParcelStatus;
  isFavorite: boolean;
  addedAt: number;
  lastViewedAt: number;
}

export interface ParcelStoreData {
  parcels: ParcelRecord[];
  isDarkMode: boolean;
}

const DEFAULT_DATA: ParcelStoreData = {
  parcels: [],
  isDarkMode: false,
};

const STORAGE_KEY = 'simplanner_parcel_data';

// ─── Store Hook ─────────────────────────────────────────────────────────────

export function useParcelStore() {
  const [data, setData] = useState<ParcelStoreData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_DATA;
    } catch {
      return DEFAULT_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (data.isDarkMode) {
      document.body.classList.add('parcel-dark-mode');
    } else {
      document.body.classList.remove('parcel-dark-mode');
    }
  }, [data.isDarkMode]);

  const addParcel = useCallback((parcel: Omit<ParcelRecord, 'id' | 'addedAt' | 'lastViewedAt' | 'status'>) => {
    const newParcel: ParcelRecord = {
      ...parcel,
      id: crypto.randomUUID(),
      status: '배송중', // Default status
      addedAt: Date.now(),
      lastViewedAt: Date.now(),
    };
    setData(prev => ({ ...prev, parcels: [newParcel, ...prev.parcels] }));
    return newParcel;
  }, []);

  const updateParcel = useCallback((id: string, updates: Partial<ParcelRecord>) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => (p.id === id ? { ...p, ...updates } : p)),
    }));
  }, []);

  const deleteParcel = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.filter(p => p.id !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)),
    }));
  }, []);

  const markViewed = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => (p.id === id ? { ...p, lastViewedAt: Date.now() } : p)),
    }));
  }, []);

  const updateStatus = useCallback((id: string, status: ParcelStatus) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => (p.id === id ? { ...p, status } : p)),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setData(prev => ({ ...prev, parcels: [] }));
  }, []);

  const setDarkMode = useCallback((isDark: boolean) => {
    setData(prev => ({ ...prev, isDarkMode: isDark }));
  }, []);

  const importData = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.parcels) {
        setData(parsed);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }, []);

  // Computed
  const stats = useMemo(() => {
    return {
      total: data.parcels.length,
      transit: data.parcels.filter(p => p.status === '배송중').length,
      today: data.parcels.filter(p => p.status === '오늘도착').length,
      completed: data.parcels.filter(p => p.status === '완료').length,
    };
  }, [data.parcels]);

  const recentParcels = useMemo(() => {
    return [...data.parcels].sort((a, b) => b.lastViewedAt - a.lastViewedAt).slice(0, 10);
  }, [data.parcels]);

  const favorites = useMemo(() => {
    return data.parcels.filter(p => p.isFavorite).sort((a, b) => b.lastViewedAt - a.lastViewedAt);
  }, [data.parcels]);

  return {
    ...data,
    addParcel,
    updateParcel,
    deleteParcel,
    toggleFavorite,
    markViewed,
    updateStatus,
    clearHistory,
    setDarkMode,
    importData,
    stats,
    recentParcels,
    favorites,
  };
}
