import { useState, useEffect, useCallback, useMemo } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Vehicle {
  id: string;
  name: string;
  number: string;
  manufacturer: string;
  model: string;
  year: number;
  fuelType: '가솔린' | '디젤' | 'LPG' | '전기' | '하이브리드' | '수소';
  currentMileage: number;
  insuranceDate: string; // YYYY-MM-DD
  inspectionDate: string; // YYYY-MM-DD
  photo: string; // base64 or empty
}

export interface DriveRecord {
  id: string;
  vehicleId: string;
  date: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  startLocation: string;
  destination: string;
  purpose: '출퇴근' | '업무' | '개인' | '기타';
  memo: string;
  timestamp: number;
}

export interface FuelRecord {
  id: string;
  vehicleId: string;
  date: string;
  station: string;
  fuelType: string;
  amount: number; // cost in KRW
  quantity: number; // liters
  odometer: number;
  efficiency: number; // km/L (auto-calculated)
  costPerKm: number; // won/km (auto-calculated)
  timestamp: number;
}

export type MaintenanceCategory = '엔진오일' | '타이어' | '배터리' | '브레이크' | '점검' | '세차' | '기타';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  date: string;
  category: MaintenanceCategory;
  cost: number;
  mileage: number;
  memo: string;
  photo: string;
  timestamp: number;
}

export type ExpenseCategory = '주유' | '톨비' | '주차' | '정비' | '보험' | '자동차세' | '세차' | '기타';

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  memo: string;
  timestamp: number;
}

export interface Reminder {
  id: string;
  type: 'insurance' | 'inspection' | 'oil' | 'maintenance';
  vehicleId: string;
  vehicleName: string;
  message: string;
  dueDate: string;
  daysLeft: number;
  severity: 'info' | 'warning' | 'danger';
}

export interface AIInsight {
  id: string;
  type: 'cost' | 'efficiency' | 'maintenance' | 'anomaly';
  icon: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'success';
}

export interface MonthlyStats {
  mileage: number;
  fuelCost: number;
  maintenanceCost: number;
  totalExpenses: number;
  avgEfficiency: number;
}

interface CarLedgerData {
  vehicles: Vehicle[];
  drives: DriveRecord[];
  fuels: FuelRecord[];
  maintenances: MaintenanceRecord[];
  expenses: ExpenseRecord[];
}

const STORAGE_KEY = 'simplanner_car_ledger_data';

function loadData(): CarLedgerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load car ledger data', e);
  }
  return { vehicles: [], drives: [], fuels: [], maintenances: [], expenses: [] };
}

function saveData(data: CarLedgerData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCarLedgerStore() {
  const [data, setData] = useState<CarLedgerData>(loadData);

  useEffect(() => {
    const handleCarLedgerUpdated = () => {
      setData(loadData());
    };
    window.addEventListener('car_ledger_updated', handleCarLedgerUpdated);
    
    return () => {
      window.removeEventListener('car_ledger_updated', handleCarLedgerUpdated);
    };
  }, []);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // ── Vehicle CRUD ──

  const addVehicle = useCallback((v: Omit<Vehicle, 'id'>) => {
    setData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, { ...v, id: crypto.randomUUID() }],
    }));
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => (v.id === id ? { ...v, ...updates } : v)),
    }));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
      drives: prev.drives.filter(d => d.vehicleId !== id),
      fuels: prev.fuels.filter(f => f.vehicleId !== id),
      maintenances: prev.maintenances.filter(m => m.vehicleId !== id),
      expenses: prev.expenses.filter(e => e.vehicleId !== id),
    }));
  }, []);

  // ── Drive CRUD ──

  const addDrive = useCallback((d: Omit<DriveRecord, 'id' | 'timestamp' | 'distance'>) => {
    const distance = Math.max(0, d.endOdometer - d.startOdometer);
    setData(prev => {
      const newDrives = [
        { ...d, id: crypto.randomUUID(), timestamp: Date.now(), distance },
        ...prev.drives,
      ];
      // Update vehicle mileage
      const vehicles = prev.vehicles.map(v =>
        v.id === d.vehicleId ? { ...v, currentMileage: Math.max(v.currentMileage, d.endOdometer) } : v
      );
      return { ...prev, drives: newDrives, vehicles };
    });
  }, []);

  const deleteDrive = useCallback((id: string) => {
    setData(prev => ({ ...prev, drives: prev.drives.filter(d => d.id !== id) }));
  }, []);

  // ── Fuel CRUD ──

  const addFuel = useCallback((f: Omit<FuelRecord, 'id' | 'timestamp' | 'efficiency' | 'costPerKm'>) => {
    setData(prev => {
      // Calculate efficiency: find previous fuel record for same vehicle
      const prevFuels = prev.fuels
        .filter(pf => pf.vehicleId === f.vehicleId && pf.odometer < f.odometer)
        .sort((a, b) => b.odometer - a.odometer);

      let efficiency = 0;
      let costPerKm = 0;

      if (prevFuels.length > 0) {
        const distSinceLast = f.odometer - prevFuels[0].odometer;
        if (distSinceLast > 0 && f.quantity > 0) {
          efficiency = Math.round((distSinceLast / f.quantity) * 100) / 100;
          costPerKm = Math.round((f.amount / distSinceLast) * 100) / 100;
        }
      }

      const newFuels = [
        { ...f, id: crypto.randomUUID(), timestamp: Date.now(), efficiency, costPerKm },
        ...prev.fuels,
      ];
      const vehicles = prev.vehicles.map(v =>
        v.id === f.vehicleId ? { ...v, currentMileage: Math.max(v.currentMileage, f.odometer) } : v
      );
      return { ...prev, fuels: newFuels, vehicles };
    });
  }, []);

  const deleteFuel = useCallback((id: string) => {
    setData(prev => ({ ...prev, fuels: prev.fuels.filter(f => f.id !== id) }));
  }, []);

  // ── Maintenance CRUD ──

  const addMaintenance = useCallback((m: Omit<MaintenanceRecord, 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      maintenances: [{ ...m, id: crypto.randomUUID(), timestamp: Date.now() }, ...prev.maintenances],
    }));
  }, []);

  const deleteMaintenance = useCallback((id: string) => {
    setData(prev => ({ ...prev, maintenances: prev.maintenances.filter(m => m.id !== id) }));
  }, []);

  // ── Expense CRUD ──

  const addExpense = useCallback((e: Omit<ExpenseRecord, 'id' | 'timestamp'>) => {
    setData(prev => ({
      ...prev,
      expenses: [{ ...e, id: crypto.randomUUID(), timestamp: Date.now() }, ...prev.expenses],
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  }, []);

  // ── Computed: Monthly Stats ──

  const getMonthlyStats = useCallback(
    (vehicleId?: string): MonthlyStats => {
      const now = new Date();
      const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const filterVehicle = <T extends { vehicleId: string; date: string }>(arr: T[]) =>
        arr.filter(r => r.date.startsWith(monthPrefix) && (!vehicleId || r.vehicleId === vehicleId));

      const monthDrives = filterVehicle(data.drives);
      const monthFuels = filterVehicle(data.fuels);
      const monthMaintenances = filterVehicle(data.maintenances);
      const monthExpenses = filterVehicle(data.expenses);

      const mileage = monthDrives.reduce((s, d) => s + d.distance, 0);
      const fuelCost = monthFuels.reduce((s, f) => s + f.amount, 0);
      const maintenanceCost = monthMaintenances.reduce((s, m) => s + m.cost, 0);
      const expenseCost = monthExpenses.reduce((s, e) => s + e.amount, 0);
      const totalExpenses = fuelCost + maintenanceCost + expenseCost;

      // Average efficiency from recent fuel records
      const recentFuels = data.fuels
        .filter(f => (!vehicleId || f.vehicleId === vehicleId) && f.efficiency > 0)
        .slice(0, 10);
      const avgEfficiency =
        recentFuels.length > 0
          ? Math.round((recentFuels.reduce((s, f) => s + f.efficiency, 0) / recentFuels.length) * 100) / 100
          : 0;

      return { mileage, fuelCost, maintenanceCost, totalExpenses, avgEfficiency };
    },
    [data]
  );

  // ── Computed: Last Odometer for a Vehicle ──

  const getLastOdometer = useCallback(
    (vehicleId: string): number => {
      const vehicle = data.vehicles.find(v => v.id === vehicleId);
      const driveOdos = data.drives.filter(d => d.vehicleId === vehicleId).map(d => d.endOdometer);
      const fuelOdos = data.fuels.filter(f => f.vehicleId === vehicleId).map(f => f.odometer);
      const allOdos = [...driveOdos, ...fuelOdos, vehicle?.currentMileage ?? 0];
      return allOdos.length > 0 ? Math.max(...allOdos) : 0;
    },
    [data]
  );

  // ── Computed: Recent Locations ──

  const getRecentLocations = useCallback((): string[] => {
    const locs = new Set<string>();
    for (const d of data.drives.slice(0, 30)) {
      if (d.startLocation) locs.add(d.startLocation);
      if (d.destination) locs.add(d.destination);
    }
    return Array.from(locs).slice(0, 10);
  }, [data]);

  // ── Computed: Reminders ──

  const reminders = useMemo((): Reminder[] => {
    const today = new Date();
    const result: Reminder[] = [];

    for (const v of data.vehicles) {
      // Insurance reminder
      if (v.insuranceDate) {
        const insDate = new Date(v.insuranceDate);
        const daysLeft = Math.ceil((insDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          result.push({
            id: `ins-${v.id}`,
            type: 'insurance',
            vehicleId: v.id,
            vehicleName: v.name,
            message: daysLeft <= 0 ? `보험 만료됨` : `보험 만료 ${daysLeft}일 전`,
            dueDate: v.insuranceDate,
            daysLeft,
            severity: daysLeft <= 0 ? 'danger' : daysLeft <= 7 ? 'warning' : 'info',
          });
        }
      }

      // Inspection reminder
      if (v.inspectionDate) {
        const inspDate = new Date(v.inspectionDate);
        const daysLeft = Math.ceil((inspDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 30) {
          result.push({
            id: `insp-${v.id}`,
            type: 'inspection',
            vehicleId: v.id,
            vehicleName: v.name,
            message: daysLeft <= 0 ? `검사 만료됨` : `검사 만료 ${daysLeft}일 전`,
            dueDate: v.inspectionDate,
            daysLeft,
            severity: daysLeft <= 0 ? 'danger' : daysLeft <= 7 ? 'warning' : 'info',
          });
        }
      }

      // Oil change reminder (every 10,000 km)
      const lastOil = data.maintenances
        .filter(m => m.vehicleId === v.id && m.category === '엔진오일')
        .sort((a, b) => b.mileage - a.mileage)[0];

      if (lastOil) {
        const kmSinceOil = v.currentMileage - lastOil.mileage;
        if (kmSinceOil >= 8000) {
          result.push({
            id: `oil-${v.id}`,
            type: 'oil',
            vehicleId: v.id,
            vehicleName: v.name,
            message:
              kmSinceOil >= 10000
                ? `엔진오일 교체 필요 (${kmSinceOil.toLocaleString()}km 경과)`
                : `엔진오일 교체 예정 (${kmSinceOil.toLocaleString()}km 경과)`,
            dueDate: '',
            daysLeft: 0,
            severity: kmSinceOil >= 10000 ? 'danger' : 'warning',
          });
        }
      }
    }

    return result.sort((a, b) => a.severity === 'danger' ? -1 : b.severity === 'danger' ? 1 : 0);
  }, [data]);

  // ── Computed: AI Insights ──

  const aiInsights = useMemo((): AIInsight[] => {
    const insights: AIInsight[] = [];

    // 1. Expected monthly cost (3-month rolling avg)
    const now = new Date();
    const monthCosts: number[] = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const fuelCost = data.fuels.filter(f => f.date.startsWith(prefix)).reduce((s, f) => s + f.amount, 0);
      const maintCost = data.maintenances.filter(m => m.date.startsWith(prefix)).reduce((s, m) => s + m.cost, 0);
      const expCost = data.expenses.filter(e => e.date.startsWith(prefix)).reduce((s, e) => s + e.amount, 0);
      monthCosts.push(fuelCost + maintCost + expCost);
    }
    const validMonths = monthCosts.filter(c => c > 0);
    if (validMonths.length > 0) {
      const avg = Math.round(validMonths.reduce((a, b) => a + b, 0) / validMonths.length);
      insights.push({
        id: 'expected-cost',
        type: 'cost',
        icon: '💰',
        title: '예상 월간 비용',
        message: `최근 ${validMonths.length}개월 평균 기준 약 ${avg.toLocaleString()}원이 예상됩니다.`,
        severity: 'info',
      });
    }

    // 2. Fuel efficiency change
    const recentFuels = data.fuels.filter(f => f.efficiency > 0).slice(0, 6);
    if (recentFuels.length >= 3) {
      const recent3 = recentFuels.slice(0, 3);
      const older3 = recentFuels.slice(3, 6);
      const recentAvg = recent3.reduce((s, f) => s + f.efficiency, 0) / recent3.length;

      if (older3.length > 0) {
        const olderAvg = older3.reduce((s, f) => s + f.efficiency, 0) / older3.length;
        const change = ((recentAvg - olderAvg) / olderAvg) * 100;

        if (Math.abs(change) >= 5) {
          insights.push({
            id: 'efficiency-change',
            type: 'efficiency',
            icon: change > 0 ? '📈' : '📉',
            title: '연비 변화 감지',
            message:
              change > 0
                ? `최근 연비가 ${Math.abs(change).toFixed(1)}% 개선되었습니다! (${recentAvg.toFixed(1)}km/L)`
                : `최근 연비가 ${Math.abs(change).toFixed(1)}% 하락했습니다. (${recentAvg.toFixed(1)}km/L) 점검을 권장합니다.`,
            severity: change > 0 ? 'success' : 'warning',
          });
        }
      }
    }

    // 3. Abnormal fuel usage
    if (recentFuels.length >= 2) {
      const avgCost = recentFuels.reduce((s, f) => s + f.amount, 0) / recentFuels.length;
      const latest = recentFuels[0];
      const deviation = ((latest.amount - avgCost) / avgCost) * 100;

      if (deviation > 30) {
        insights.push({
          id: 'abnormal-fuel',
          type: 'anomaly',
          icon: '⚠️',
          title: '비정상 주유 감지',
          message: `최근 주유 비용이 평균 대비 ${deviation.toFixed(0)}% 높습니다. 확인이 필요합니다.`,
          severity: 'warning',
        });
      }
    }

    // 4. Maintenance suggestion
    for (const v of data.vehicles) {
      const lastMaint = data.maintenances
        .filter(m => m.vehicleId === v.id)
        .sort((a, b) => b.mileage - a.mileage)[0];

      if (lastMaint && v.currentMileage - lastMaint.mileage > 15000) {
        insights.push({
          id: `maint-suggest-${v.id}`,
          type: 'maintenance',
          icon: '🔧',
          title: `${v.name} 종합 점검 권장`,
          message: `마지막 정비 이후 ${(v.currentMileage - lastMaint.mileage).toLocaleString()}km를 주행했습니다. 종합 점검을 권장합니다.`,
          severity: 'warning',
        });
      }
    }

    return insights;
  }, [data]);

  // ── Computed: Recent Activities (combined & sorted) ──

  const recentActivities = useMemo(() => {
    type Activity = {
      id: string;
      type: 'drive' | 'fuel' | 'maintenance' | 'expense';
      date: string;
      vehicleId: string;
      summary: string;
      detail: string;
      timestamp: number;
    };

    const activities: Activity[] = [];

    for (const d of data.drives.slice(0, 10)) {
      activities.push({
        id: d.id,
        type: 'drive',
        date: d.date,
        vehicleId: d.vehicleId,
        summary: `${d.startLocation} → ${d.destination}`,
        detail: `${d.distance.toLocaleString()}km`,
        timestamp: d.timestamp,
      });
    }

    for (const f of data.fuels.slice(0, 10)) {
      activities.push({
        id: f.id,
        type: 'fuel',
        date: f.date,
        vehicleId: f.vehicleId,
        summary: f.station || '주유',
        detail: `${f.amount.toLocaleString()}원 / ${f.quantity}L`,
        timestamp: f.timestamp,
      });
    }

    for (const m of data.maintenances.slice(0, 10)) {
      activities.push({
        id: m.id,
        type: 'maintenance',
        date: m.date,
        vehicleId: m.vehicleId,
        summary: m.category,
        detail: `${m.cost.toLocaleString()}원`,
        timestamp: m.timestamp,
      });
    }

    for (const e of data.expenses.slice(0, 10)) {
      activities.push({
        id: e.id,
        type: 'expense',
        date: e.date,
        vehicleId: e.vehicleId,
        summary: e.category,
        detail: `${e.amount.toLocaleString()}원`,
        timestamp: e.timestamp,
      });
    }

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
  }, [data]);

  // ── Chart Data Helpers ──

  const getChartData = useCallback(
    (months: number, vehicleId?: string) => {
      const now = new Date();
      const result: Array<{
        month: string;
        label: string;
        fuelCost: number;
        maintenanceCost: number;
        expenseCost: number;
        totalCost: number;
        mileage: number;
        efficiency: number;
      }> = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = `${d.getMonth() + 1}월`;

        const filter = <T extends { vehicleId: string; date: string }>(arr: T[]) =>
          arr.filter(r => r.date.startsWith(prefix) && (!vehicleId || r.vehicleId === vehicleId));

        const monthDrives = filter(data.drives);
        const monthFuels = filter(data.fuels);
        const monthMaints = filter(data.maintenances);
        const monthExps = filter(data.expenses);

        const fuelCost = monthFuels.reduce((s, f) => s + f.amount, 0);
        const maintenanceCost = monthMaints.reduce((s, m) => s + m.cost, 0);
        const expenseCost = monthExps.reduce((s, e) => s + e.amount, 0);
        const mileage = monthDrives.reduce((s, dd) => s + dd.distance, 0);
        const effFuels = monthFuels.filter(f => f.efficiency > 0);
        const efficiency =
          effFuels.length > 0
            ? Math.round((effFuels.reduce((s, f) => s + f.efficiency, 0) / effFuels.length) * 100) / 100
            : 0;

        result.push({
          month: prefix,
          label,
          fuelCost,
          maintenanceCost,
          expenseCost,
          totalCost: fuelCost + maintenanceCost + expenseCost,
          mileage,
          efficiency,
        });
      }

      return result;
    },
    [data]
  );

  // ── Calendar Events ──

  const getCalendarEvents = useCallback(
    (yearMonth: string, vehicleId?: string) => {
      type CalendarEvent = {
        id: string;
        date: string;
        type: 'drive' | 'fuel' | 'maintenance' | 'expense' | 'insurance' | 'inspection';
        summary: string;
      };

      const events: CalendarEvent[] = [];
      const filter = <T extends { vehicleId: string; date: string }>(arr: T[]) =>
        arr.filter(r => r.date.startsWith(yearMonth) && (!vehicleId || r.vehicleId === vehicleId));

      for (const d of filter(data.drives)) {
        events.push({ id: d.id, date: d.date, type: 'drive', summary: `${d.startLocation} → ${d.destination} (${d.distance}km)` });
      }
      for (const f of filter(data.fuels)) {
        events.push({ id: f.id, date: f.date, type: 'fuel', summary: `${f.station || '주유'} ${f.amount.toLocaleString()}원` });
      }
      for (const m of filter(data.maintenances)) {
        events.push({ id: m.id, date: m.date, type: 'maintenance', summary: `${m.category} ${m.cost.toLocaleString()}원` });
      }
      for (const e of filter(data.expenses)) {
        events.push({ id: e.id, date: e.date, type: 'expense', summary: `${e.category} ${e.amount.toLocaleString()}원` });
      }

      // Insurance / Inspection dates
      for (const v of data.vehicles) {
        if ((!vehicleId || v.id === vehicleId) && v.insuranceDate?.startsWith(yearMonth)) {
          events.push({ id: `ins-${v.id}`, date: v.insuranceDate, type: 'insurance', summary: `${v.name} 보험 만료` });
        }
        if ((!vehicleId || v.id === vehicleId) && v.inspectionDate?.startsWith(yearMonth)) {
          events.push({ id: `insp-${v.id}`, date: v.inspectionDate, type: 'inspection', summary: `${v.name} 검사 만료` });
        }
      }

      return events.sort((a, b) => a.date.localeCompare(b.date));
    },
    [data]
  );

  // ── Data management ──

  const clearAllData = useCallback(() => {
    setData({ vehicles: [], drives: [], fuels: [], maintenances: [], expenses: [] });
  }, []);

  return {
    // Data
    vehicles: data.vehicles,
    drives: data.drives,
    fuels: data.fuels,
    maintenances: data.maintenances,
    expenses: data.expenses,

    // Vehicle
    addVehicle,
    updateVehicle,
    deleteVehicle,

    // Drive
    addDrive,
    deleteDrive,

    // Fuel
    addFuel,
    deleteFuel,

    // Maintenance
    addMaintenance,
    deleteMaintenance,

    // Expense
    addExpense,
    deleteExpense,

    // Computed
    getMonthlyStats,
    getLastOdometer,
    getRecentLocations,
    reminders,
    aiInsights,
    recentActivities,
    getChartData,
    getCalendarEvents,

    // Data management
    clearAllData,
  };
}
