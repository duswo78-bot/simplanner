import { useState, useEffect, useCallback, useMemo } from 'react';

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
  expectedPayment: number;
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

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const CARD_CATALOG = cardCatalogData as Card[];

const MOCK_DATA: FinanceData = {
  cards: [CARD_CATALOG[0], CARD_CATALOG[1]], // 사용자가 보유한 카드는 카탈로그의 앞 2개로 초기화
  accounts: [
    { id: 'a1', bankName: '국민은행', accountNumber: '1234-56-789012', alias: '생활비', balance: 1450000, isFavorite: true },
    { id: 'a2', bankName: '신한은행', accountNumber: '110-123-456789', alias: '급여계좌', balance: 3200000, isFavorite: true },
    { id: 'a3', bankName: '카카오뱅크', accountNumber: '3333-11-222333', alias: '비상금', balance: 5000000, isFavorite: false }
  ],
  autoTransfers: [
    { id: 't1', name: '아파트 관리비', category: '주거/공과금', paymentDate: 10, amount: 280000, paymentMethod: '국민은행 생활비' },
    { id: 't2', name: '도시가스 요금', category: '주거/공과금', paymentDate: 15, amount: 45000, paymentMethod: '현대카드 M' },
    { id: 't3', name: '실비보험 (메리츠)', category: '보험', paymentDate: 20, amount: 125000, paymentMethod: '국민은행 생활비' },
    { id: 't4', name: '넷플릭스', category: '구독', paymentDate: 5, amount: 13500, paymentMethod: '삼성 taptap O' },
    { id: 't5', name: '유튜브 프리미엄', category: '구독', paymentDate: 12, amount: 14900, paymentMethod: '현대카드 M' },
    { id: 't6', name: '통신비 (SKT)', category: '통신', paymentDate: 25, amount: 78000, paymentMethod: '삼성 taptap O' },
  ],
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
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load finance data', e);
  }
  return MOCK_DATA;
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

  // Computed Properties (AI Insights Mock)
  const totalExpectedPayment = useMemo(() => {
    return data.cards.reduce((sum, card) => sum + card.expectedPayment, 0);
  }, [data.cards]);

  const totalAnnualFee = useMemo(() => {
    return data.cards.reduce((sum, card) => sum + card.annualFee, 0);
  }, [data.cards]);

  const expectedMonthlyBalance = useMemo(() => {
    const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    return totalBalance - totalExpectedPayment;
  }, [data.accounts, totalExpectedPayment]);

  const aiInsights = useMemo(() => {
    const insights = [];
    
    // 1. 오늘의 자동이체 알림 (데모를 위해 오늘을 15일로 가정)
    const today = 15; 
    const todayTransfers = data.autoTransfers.filter(t => t.paymentDate === today);
    if (todayTransfers.length > 0) {
      const totalAmount = todayTransfers.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        id: 'auto-transfer-alert',
        title: '오늘 자동이체 출금일!',
        message: `오늘은 ${todayTransfers.map(t => t.name).join(', ')} 총 ${totalAmount.toLocaleString()}원 결제 예정입니다. 잔고를 확인해주세요.`,
        isUrgent: true
      });
    }

    // 2. AI 실적 도우미
    const needingPerformance = data.cards.find(c => c.targetPerformance > c.currentPerformance);
    if (needingPerformance) {
      const shortage = needingPerformance.targetPerformance - needingPerformance.currentPerformance;
      insights.push({
        id: 'perf-1',
        title: 'AI 실적 도우미',
        message: `${needingPerformance.name} 실적 ${shortage.toLocaleString()}원 부족. 마트/주유 이용 추천.`,
        isUrgent: false
      });
    }

    // 3. AI 카드값 폭탄 예측
    if (totalExpectedPayment > 1000000) {
      insights.push({
        id: 'bomb-1',
        title: 'AI 카드값 폭탄 예측',
        message: `다음 결제일 총 청구 ${totalExpectedPayment.toLocaleString()}원. 평균 대비 42% 증가.`,
        isUrgent: true
      });
    }

    // 4. AI 금융 건강 점수
    insights.push({
      id: 'health-1',
      title: 'AI 금융 건강 점수',
      message: '현재 금융 건강 점수 88점. 혜택 활용도가 높습니다.',
      isUrgent: false
    });

    return insights;
  }, [data.cards, data.autoTransfers, totalExpectedPayment]);

  return {
    ...data,
    updateSettings,
    addCard,
    removeCard,
    addAutoTransfer,
    removeAutoTransfer,
    totalExpectedPayment,
    totalAnnualFee,
    expectedMonthlyBalance,
    aiInsights
  };
}
