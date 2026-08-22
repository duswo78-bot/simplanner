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
  { id: 'de.dhl', name: 'DHL', type: 'international' },
  { id: 'us.ups', name: 'UPS', type: 'international', detectPattern: /^1Z[A-Z0-9]{16}$/ },
  { id: 'us.fedex', name: 'FedEx', type: 'international', detectPattern: /^\d{12,15}$/ },
  { id: 'un.upu.ems', name: 'EMS', type: 'international', detectPattern: /^[A-Z]{2}\d{9}[A-Z]{2}$/ },
  { id: 'us.usps', name: 'USPS', type: 'international', detectPattern: /^\d{20,22}$/ },
  { id: 'cn.chinapost', name: 'China Post', type: 'international' },
  { id: 'cn.cainiao.global', name: 'Cainiao', type: 'international' },
  { id: 'cn.yanwen', name: 'Yanwen', type: 'international' },
  { id: 'cn.4px', name: '4PX', type: 'international' },
  { id: 'cn.sfexpress', name: 'SF Express', type: 'international' },
  { id: 'cn.yunexpress', name: 'YunExpress', type: 'international' },
  { id: 'un.ecms', name: 'ECMS', type: 'international' },
];

export const getCarrierName = (id: string) => CARRIERS.find(c => c.id === id)?.name || '알 수 없음';

export const detectCarrier = (trackingNumber: string): Carrier | null => {
  const cleanNumber = trackingNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (cleanNumber.startsWith('1Z')) return CARRIERS.find(c => c.id === 'us.ups') || null;
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'un.upu.ems') || null;
  if (cleanNumber.length === 13 && /^\d{13}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'kr.epost') || null;
  if (cleanNumber.length === 11 && /^\d{11}$/.test(cleanNumber)) return CARRIERS.find(c => c.id === 'kr.logen') || null;

  if (/^\d{10,12}$/.test(cleanNumber)) {
    return CARRIERS.find(c => c.id === 'kr.cjlogistics') || null;
  }

  return null;
};

export type ParcelStatus = '준비' | '배송중' | '오늘도착' | '완료';

/** in=받기, out=보내기, return=반품 */
export type ParcelDirection = 'in' | 'out' | 'return';

/** 홈 대시보드 필터 */
export type ParcelDashboardFilter = 'all' | '배송중' | '오늘도착' | '완료';

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
  /** 배송완료로 바뀐 시각 (자동 정리용) */
  completedAt?: number;
  /** in=받기(기본), out=보내기, return=반품 */
  direction?: ParcelDirection;
}

/** 반품 여부 (태그 또는 direction=return). 반품은 보내기 집계에 포함 */
export function isReturnParcel(p: ParcelRecord): boolean {
  if (p.direction === 'return') return true;
  return Boolean(p.tags?.includes('반품'));
}

/** 정규화된 방향 (미지정 시 태그·임시송장으로 추론). 반품 → out */
export function getParcelDirection(p: ParcelRecord): ParcelDirection {
  if (isReturnParcel(p)) return 'return';
  if (p.direction === 'out' || p.direction === 'in') return p.direction;
  if (p.trackingNumber?.startsWith('CVS-PENDING')) return 'out';
  if (p.tags?.includes('발송') || p.tags?.includes('편의점택배')) return 'out';
  return 'in';
}

/** 보내기 = out + 반품 */
export function isOutboundParcel(p: ParcelRecord): boolean {
  const d = getParcelDirection(p);
  return d === 'out' || d === 'return';
}

export function isInboundParcel(p: ParcelRecord): boolean {
  return getParcelDirection(p) === 'in';
}

/** 목록 뱃지: 반품 > 보내기 > 받기 */
export function getDirectionDisplay(p: ParcelRecord): ParcelDirection {
  return getParcelDirection(p);
}

export const DIRECTION_LABEL: Record<ParcelDirection, string> = {
  in: '받기',
  out: '보내기',
  return: '반품',
};

export interface ParcelSettings {
  autoCleanupCompleted: boolean;
  /** 완료 후 N일이 지나면 삭제 (기본 7) */
  autoCleanupDays: number;
}

export interface ParcelStoreData {
  parcels: ParcelRecord[];
  isDarkMode: boolean;
  settings: ParcelSettings;
}

const DEFAULT_SETTINGS: ParcelSettings = {
  autoCleanupCompleted: false,
  autoCleanupDays: 7,
};

const DEFAULT_DATA: ParcelStoreData = {
  parcels: [],
  isDarkMode: false,
  settings: { ...DEFAULT_SETTINGS },
};

const STORAGE_KEY = 'simplanner_parcel_data';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function loadData(): ParcelStoreData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_DATA;
    const parsed = JSON.parse(stored);
    return {
      parcels: Array.isArray(parsed.parcels) ? parsed.parcels : [],
      isDarkMode: Boolean(parsed.isDarkMode),
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch {
    return DEFAULT_DATA;
  }
}

function cleanupCompletedParcels(
  parcels: ParcelRecord[],
  settings: ParcelSettings,
  now = Date.now()
): ParcelRecord[] {
  if (!settings.autoCleanupCompleted) return parcels;
  const days = Math.max(1, settings.autoCleanupDays || 7);
  const cutoff = now - days * MS_PER_DAY;

  return parcels.filter((p) => {
    if (p.status !== '완료') return true;
    const doneAt = p.completedAt ?? p.lastViewedAt ?? p.addedAt ?? 0;
    return doneAt >= cutoff;
  });
}

// ─── Store Hook ─────────────────────────────────────────────────────────────

export function useParcelStore() {
  const [data, setData] = useState<ParcelStoreData>(() => {
    const loaded = loadData();
    return {
      ...loaded,
      parcels: cleanupCompletedParcels(loaded.parcels, loaded.settings),
    };
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

  // 자동 정리: 설정 on이거나 완료 건이 바뀔 때 재적용
  useEffect(() => {
    if (!data.settings.autoCleanupCompleted) return;
    setData((prev) => {
      if (!prev.settings.autoCleanupCompleted) return prev;
      const next = cleanupCompletedParcels(prev.parcels, prev.settings);
      if (next.length === prev.parcels.length) return prev;
      // id 집합이 같으면 스킵
      const prevIds = prev.parcels.map((p) => p.id).join(',');
      const nextIds = next.map((p) => p.id).join(',');
      if (prevIds === nextIds) return prev;
      return { ...prev, parcels: next };
    });
  }, [data.settings.autoCleanupCompleted, data.settings.autoCleanupDays, data.parcels.length]);

  const addParcel = useCallback((
    parcel: Omit<ParcelRecord, 'id' | 'addedAt' | 'lastViewedAt' | 'status' | 'completedAt'> & {
      status?: ParcelStatus;
      direction?: ParcelDirection;
    }
  ) => {
    const status = parcel.status || '배송중';
    const { status: _s, ...rest } = parcel;
    const direction: ParcelDirection = rest.direction || 'in';
    const newParcel: ParcelRecord = {
      ...rest,
      id: crypto.randomUUID(),
      status,
      direction,
      addedAt: Date.now(),
      lastViewedAt: Date.now(),
      completedAt: status === '완료' ? Date.now() : undefined,
    };
    setData(prev => ({ ...prev, parcels: [newParcel, ...prev.parcels] }));
    return newParcel;
  }, []);

  const updateParcel = useCallback((id: string, updates: Partial<ParcelRecord>) => {
    setData(prev => ({
      ...prev,
      parcels: prev.parcels.map(p => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };
        if (updates.status === '완료' && p.status !== '완료') {
          next.completedAt = Date.now();
        }
        if (updates.status && updates.status !== '완료') {
          next.completedAt = undefined;
        }
        return next;
      }),
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
      parcels: prev.parcels.map(p => {
        if (p.id !== id) return p;
        const next: ParcelRecord = { ...p, status };
        if (status === '완료' && p.status !== '완료') {
          next.completedAt = Date.now();
        } else if (status !== '완료') {
          next.completedAt = undefined;
        }
        return next;
      }),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setData(prev => ({ ...prev, parcels: [] }));
  }, []);

  const setDarkMode = useCallback((isDark: boolean) => {
    setData(prev => ({ ...prev, isDarkMode: isDark }));
  }, []);

  const updateSettings = useCallback((updates: Partial<ParcelSettings>) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  const exportData = useCallback(() => {
    const payload = {
      version: 1,
      app: 'simplanner-parcel',
      exportedAt: new Date().toISOString(),
      data: {
        parcels: data.parcels,
        isDarkMode: data.isDarkMode,
        settings: data.settings,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcel_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  const importData = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          const raw =
            parsed?.data && Array.isArray(parsed.data.parcels)
              ? parsed.data
              : parsed;

          if (!raw || !Array.isArray(raw.parcels)) {
            resolve(false);
            return;
          }

          const parcelsValid = raw.parcels.every(
            (p: ParcelRecord) => p && typeof p.id === 'string' && typeof p.trackingNumber === 'string'
          );
          if (!parcelsValid) {
            resolve(false);
            return;
          }

          const settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
          const parcels = cleanupCompletedParcels(raw.parcels, settings);

          setData({
            parcels,
            isDarkMode: Boolean(raw.isDarkMode),
            settings,
          });
          resolve(true);
        } catch (err) {
          console.error('Parcel import failed', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  const syncStatuses = useCallback(async () => {
    const updatedParcels = await Promise.all(
      data.parcels.map(async (p) => {
        if (p.status === '완료') return p; // Skip completed
        try {
          const res = await fetch(`https://apis.tracker.delivery/carriers/${p.carrierId}/tracks/${p.trackingNumber}`);
          if (res.ok) {
            const result = await res.json();
            const stateId = result?.state?.id;
            let newStatus = p.status;
            if (stateId === 'delivered') newStatus = '완료';
            else if (stateId === 'out_for_delivery') newStatus = '오늘도착';
            else if (stateId === 'in_transit' || stateId === 'at_pickup') newStatus = '배송중';
            else if (stateId === 'information_received') newStatus = '준비';
            
            return { ...p, status: newStatus };
          }
        } catch (e) {
          // Ignore
        }
        return p;
      })
    );
    // Only update if there are changes to avoid unnecessary re-renders
    const hasChanges = updatedParcels.some((p, i) => p.status !== data.parcels[i].status);
    if (hasChanges) {
      setData(prev => ({ ...prev, parcels: updatedParcels }));
    }
  }, [data.parcels]);

  /** 문자열 복원 (구 API 호환) */
  const importDataFromJson = useCallback((jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const raw = parsed?.data?.parcels ? parsed.data : parsed;
      if (!raw?.parcels) return false;
      const settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
      setData({
        parcels: cleanupCompletedParcels(raw.parcels, settings),
        isDarkMode: Boolean(raw.isDarkMode),
        settings,
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const runCleanupNow = useCallback(() => {
    setData(prev => {
      const next = cleanupCompletedParcels(prev.parcels, {
        ...prev.settings,
        autoCleanupCompleted: true,
      });
      if (next.length === prev.parcels.length) return prev;
      return { ...prev, parcels: next };
    });
  }, []);

  // Computed — 받기 / 보내기(반품 포함) 집계
  const stats = useMemo(() => {
    const inbound = data.parcels.filter(isInboundParcel);
    const outbound = data.parcels.filter(isOutboundParcel);
    const byStatus = (list: ParcelRecord[], status: ParcelStatus) =>
      list.filter((p) => p.status === status).length;

    return {
      /** 받기 */
      total: inbound.length,
      transit: byStatus(inbound, '배송중'),
      today: byStatus(inbound, '오늘도착'),
      completed: byStatus(inbound, '완료'),
      preparing: byStatus(inbound, '준비'),
      /** 보내기 (반품 포함). 0이면 카드에서 숨김 */
      outTotal: outbound.length,
      outTransit: byStatus(outbound, '배송중'),
      outToday: byStatus(outbound, '오늘도착'),
      outCompleted: byStatus(outbound, '완료'),
      outPreparing: byStatus(outbound, '준비'),
      hasAnyOutbound: outbound.length > 0,
    };
  }, [data.parcels]);

  const outboundParcels = useMemo(() => {
    return data.parcels
      .filter(isOutboundParcel)
      .sort((a, b) => b.lastViewedAt - a.lastViewedAt);
  }, [data.parcels]);

  const recentParcels = useMemo(() => {
    return [...data.parcels].sort((a, b) => b.lastViewedAt - a.lastViewedAt).slice(0, 10);
  }, [data.parcels]);

  const favorites = useMemo(() => {
    return data.parcels.filter(p => p.isFavorite).sort((a, b) => b.lastViewedAt - a.lastViewedAt);
  }, [data.parcels]);

  const filterParcels = useCallback(
    (
      filter: ParcelDashboardFilter,
      direction: 'all' | 'in' | 'out' | 'return' = 'all'
    ) => {
      let list = [...data.parcels].sort((a, b) => b.lastViewedAt - a.lastViewedAt);
      if (direction === 'in') list = list.filter(isInboundParcel);
      // 보내기 필터 = out + 반품
      if (direction === 'out') list = list.filter(isOutboundParcel);
      if (direction === 'return') list = list.filter(isReturnParcel);
      if (filter === 'all') return list;
      // 보내기+배송중: 준비 상태 발송도 포함
      if (direction === 'out' && filter === '배송중') {
        return list.filter((p) => p.status === '배송중' || p.status === '준비');
      }
      return list.filter((p) => p.status === filter);
    },
    [data.parcels]
  );

  const setDirection = useCallback((id: string, direction: ParcelDirection) => {
    setData((prev) => ({
      ...prev,
      parcels: prev.parcels.map((p) => {
        if (p.id !== id) return p;
        let tags = [...(p.tags || [])];
        tags = tags.filter((t) => t !== '반품' && t !== '발송');
        if (direction === 'return') {
          tags = [...tags, '반품', '발송'];
          return { ...p, direction: 'out', tags };
        }
        if (direction === 'out') {
          if (!tags.includes('편의점택배')) tags = [...tags, '발송'];
          return { ...p, direction: 'out', tags };
        }
        return { ...p, direction: 'in', tags };
      }),
    }));
  }, []);

  /**
   * 반품 체크 → 보내기(+반품 태그)로 전환.
   * 반품 해제 → 반품 태그만 제거, 보내기 유지.
   */
  const toggleReturn = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      parcels: prev.parcels.map((p) => {
        if (p.id !== id) return p;
        if (isReturnParcel(p)) {
          const tags = (p.tags || []).filter((t) => t !== '반품');
          return { ...p, direction: 'out' as ParcelDirection, tags };
        }
        let tags = [...(p.tags || [])].filter((t) => t !== '반품');
        if (!tags.includes('발송') && !tags.includes('편의점택배')) {
          tags = [...tags, '발송'];
        }
        tags = [...tags, '반품'];
        return { ...p, direction: 'out' as ParcelDirection, tags };
      }),
    }));
  }, []);

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
    updateSettings,
    exportData,
    importData,
    importDataFromJson,
    runCleanupNow,
    syncStatuses,
    filterParcels,
    setDirection,
    toggleReturn,
    stats,
    outboundParcels,
    recentParcels,
    favorites,
  };
}

export async function checkParcelBadges(): Promise<ParcelRecord[]> {
  const data = loadData();
  let hasChanges = false;

  const updatedParcels = await Promise.all(
    data.parcels.map(async (p) => {
      if (p.status === '완료') return p;
      try {
        const res = await fetch(`https://apis.tracker.delivery/carriers/${p.carrierId}/tracks/${p.trackingNumber}`);
        if (res.ok) {
          const result = await res.json();
          const stateId = result?.state?.id;
          let newStatus = p.status;
          if (stateId === 'delivered') newStatus = '완료';
          else if (stateId === 'out_for_delivery') newStatus = '오늘도착';
          else if (stateId === 'in_transit' || stateId === 'at_pickup') newStatus = '배송중';
          else if (stateId === 'information_received') newStatus = '준비';
          
          if (newStatus !== p.status) hasChanges = true;
          return { ...p, status: newStatus };
        }
      } catch (e) {}
      return p;
    })
  );

  if (hasChanges) {
    data.parcels = updatedParcels;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const todayArrivals: ParcelRecord[] = [];
  updatedParcels.forEach(p => {
    if (p.status === '오늘도착' && p.direction !== 'out' && p.direction !== 'return') {
      todayArrivals.push(p);
    }
  });

  return todayArrivals;
}
