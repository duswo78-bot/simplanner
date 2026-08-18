import { useState, useEffect, useCallback, useMemo } from 'react';
import { buildFinanceInsights } from './utils/insights';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Card {
  id: string;
  company: string;
  name: string;
  annualFee: number;
  targetPerformance: number;
  currentPerformance: number;
  benefits: string[];
  image: string;
  paymentDate: number; // e.g., 14 for 14th of the month
  /** 결제 출금 은행 (카드마다 다를 수 있음) */
  paymentBank?: string;
  expectedPayment: number;
  /** 카드고릴라 detail 번호 (https://m.card-gorilla.com/card/detail/{sourceId}) */
  sourceId?: number;
  category?: string;
  source?: string;
  /** 카드사 공식 상세 URL (카드고릴라 없을 때) */
  officialUrl?: string;
  productCode?: string;
}

export interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  alias: string;
  balance: number;
  isFavorite: boolean;
}

export interface AutoTransfer {
  id: string;
  name: string; // "아파트 관리비", "넷플릭스" 등
  category: string; // "주거/공과금", "구독", "보험" 등
  paymentDate: number; // 1~31일
  amount: number;
  paymentMethod: string; // "현대카드 M", "국민은행 생활비" 등 텍스트
}

export interface Settings {
  darkMode: boolean;
  performanceAlert: boolean;
  paymentAlert: boolean;
  annualFeeAlert: boolean;
  reportAlert: boolean;
}

interface FinanceData {
  cards: Card[];
  accounts: Account[];
  autoTransfers: AutoTransfer[];
  settings: Settings;
}

const STORAGE_KEY = 'simplanner_finance_data';

import cardCatalogData from './data/cards.json';

// ─── Defaults & Catalog ──────────────────────────────────────────────────────

export const CARD_CATALOG = cardCatalogData as Card[];

const DEFAULT_DATA: FinanceData = {
  cards: [],
  accounts: [],
  autoTransfers: [],
  settings: {
    darkMode: true,
    performanceAlert: true,
    paymentAlert: true,
    annualFeeAlert: true,
    reportAlert: true,
  }
};

function loadData(): FinanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_DATA,
        ...parsed,
        cards: parsed.cards || DEFAULT_DATA.cards,
        accounts: parsed.accounts || DEFAULT_DATA.accounts,
        autoTransfers: parsed.autoTransfers || DEFAULT_DATA.autoTransfers,
        settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) }
      };
    }
  } catch (e) {
    console.error('Failed to load finance data', e);
  }
  return DEFAULT_DATA;
}

function saveData(data: FinanceData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFinanceStore() {
  const [data, setData] = useState<FinanceData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  // Actions
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
  }, []);

  const addCard = useCallback((card: Omit<Card, 'id'>) => {
    setData(prev => ({
      ...prev,
      cards: [...prev.cards, { ...card, id: crypto.randomUUID() }]
    }));
  }, []);

  const removeCard = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      cards: prev.cards.filter(c => c.id !== id)
    }));
  }, []);

  const updateCard = useCallback((id: string, updates: Partial<Omit<Card, 'id'>>) => {
    setData(prev => ({
      ...prev,
      cards: prev.cards.map(c => (c.id === id ? { ...c, ...updates } : c))
    }));
  }, []);

  const addAutoTransfer = useCallback((transfer: Omit<AutoTransfer, 'id'>) => {
    setData(prev => ({
      ...prev,
      autoTransfers: [...prev.autoTransfers, { ...transfer, id: crypto.randomUUID() }]
    }));
  }, []);

  const removeAutoTransfer = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      autoTransfers: prev.autoTransfers.filter(t => t.id !== id)
    }));
  }, []);

  const updateAutoTransfer = useCallback((id: string, updates: Partial<Omit<AutoTransfer, 'id'>>) => {
    setData(prev => ({
      ...prev,
      autoTransfers: prev.autoTransfers.map(t => (t.id === id ? { ...t, ...updates } : t))
    }));
  }, []);

  const exportData = useCallback(() => {
    const payload = {
      version: 1,
      app: 'simplanner-finance',
      exportedAt: new Date().toISOString(),
      data: {
        cards: data.cards,
        accounts: data.accounts,
        autoTransfers: data.autoTransfers,
        settings: data.settings,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
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

          // 래핑 형식 { version, data } 또는 평평한 FinanceData 모두 허용
          const raw = parsed?.data && (parsed.data.cards || parsed.data.autoTransfers || parsed.data.settings)
            ? parsed.data
            : parsed;

          if (!raw || typeof raw !== 'object') {
            resolve(false);
            return;
          }

          const cards = Array.isArray(raw.cards) ? raw.cards : [];
          const accounts = Array.isArray(raw.accounts) ? raw.accounts : [];
          const autoTransfers = Array.isArray(raw.autoTransfers) ? raw.autoTransfers : [];
          const settings = { ...DEFAULT_DATA.settings, ...(raw.settings || {}) };

          const cardsValid = cards.every(
            (c: Card) => c && typeof c.id === 'string' && typeof c.name === 'string'
          );
          const transfersValid = autoTransfers.every(
            (t: AutoTransfer) => t && typeof t.id === 'string' && typeof t.name === 'string'
          );

          if (!cardsValid || !transfersValid) {
            resolve(false);
            return;
          }

          setData({ cards, accounts, autoTransfers, settings });
          resolve(true);
        } catch (err) {
          console.error('Finance import failed', err);
          resolve(false);
        }
      };
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }, []);

  // Computed Properties
  const totalExpectedPayment = useMemo(() => {
    const cardPayments = data.cards.reduce((sum, card) => sum + card.expectedPayment, 0);
    const transferPayments = data.autoTransfers.reduce((sum, t) => sum + t.amount, 0);
    return cardPayments + transferPayments;
  }, [data.cards, data.autoTransfers]);

  const totalAnnualFee = useMemo(() => {
    return data.cards.reduce((sum, card) => sum + card.annualFee, 0);
  }, [data.cards]);

  const totalBalance = useMemo(() => {
    return data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
  }, [data.accounts]);

  const expectedMonthlyBalance = useMemo(() => {
    return totalBalance - totalExpectedPayment;
  }, [totalBalance, totalExpectedPayment]);

  const totalMonthlyAutoTransfer = useMemo(() => {
    return data.autoTransfers.reduce((sum, t) => sum + t.amount, 0);
  }, [data.autoTransfers]);

  /** 카드 비서: 결제일 D-day · 월경계 이체 · 설정 토글 · 우선순위 */
  const aiInsights = useMemo(
    () => buildFinanceInsights(data.cards, data.autoTransfers, data.settings),
    [data.cards, data.autoTransfers, data.settings]
  );

  return {
    ...data,
    updateSettings,
    addCard,
    removeCard,
    updateCard,
    addAutoTransfer,
    removeAutoTransfer,
    updateAutoTransfer,
    exportData,
    importData,
    totalExpectedPayment,
    totalAnnualFee,
    totalBalance,
    totalMonthlyAutoTransfer,
    expectedMonthlyBalance,
    aiInsights
  };
}
