import type { CSSProperties } from 'react';

/** 카드사별 플라스틱 카드 그라데이션 */

const THEMES: Record<string, { from: string; to: string }> = {
  '현대카드': { from: '#1e293b', to: '#0f172a' },
  '삼성카드': { from: '#1e3a5f', to: '#0c4a6e' },
  '신한카드': { from: '#1e3a8a', to: '#172554' },
  'KB국민카드': { from: '#854d0e', to: '#422006' },
  '우리카드': { from: '#1e40af', to: '#1e3a8a' },
  '롯데카드': { from: '#9f1239', to: '#4c0519' },
  '하나카드': { from: '#065f46', to: '#022c22' },
  'NH농협카드': { from: '#166534', to: '#052e16' },
  'BC카드': { from: '#6d28d9', to: '#4c1d95' },
  '카카오뱅크': { from: '#ca8a04', to: '#713f12' },
  '토스뱅크': { from: '#0369a1', to: '#0c4a6e' },
  '케이뱅크': { from: '#be123c', to: '#881337' },
  '씨티카드': { from: '#0e7490', to: '#164e63' },
};

const FALLBACK = { from: '#4338ca', to: '#312e81' };

export function getCardTheme(company: string): { from: string; to: string } {
  return THEMES[company] || FALLBACK;
}

export function cardFaceStyle(company: string): CSSProperties {
  const t = getCardTheme(company);
  return {
    background: `linear-gradient(145deg, ${t.from} 0%, ${t.to} 100%)`,
  };
}
