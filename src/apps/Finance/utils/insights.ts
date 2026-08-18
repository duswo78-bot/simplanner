import type { AutoTransfer, Card, Settings } from '../FinanceStore';

export type InsightNav = 'cards' | 'transfer' | 'analysis' | 'settings';

export interface FinanceInsight {
  id: string;
  title: string;
  message: string;
  isUrgent: boolean;
  /** 낮을수록 먼저 표시 */
  priority: number;
  nav?: InsightNav;
}

const MAX_INSIGHTS = 6;
/** 결제일/이체 D-day 알림 범위 (오늘 포함) */
const DDAY_WINDOW = 3;

/** 해당 월의 유효한 결제일 (31일 카드 → 2월은 28/29) */
export function clampDayInMonth(day: number, year: number, monthIndex: number): number {
  const dim = new Date(year, monthIndex + 1, 0).getDate();
  return Math.min(Math.max(1, day), dim);
}

/**
 * 매월 반복 결제일까지 남은 일수 (월 경계 롤오버 포함)
 * 오늘이 결제일 → 0
 */
export function daysUntilMonthlyDay(paymentDay: number, from: Date = new Date()): number {
  if (paymentDay < 1 || paymentDay > 31) return Number.POSITIVE_INFINITY;

  const y = from.getFullYear();
  const m = from.getMonth();
  const today = from.getDate();

  const thisMonthDay = clampDayInMonth(paymentDay, y, m);
  if (today <= thisMonthDay) {
    return thisMonthDay - today;
  }

  const nextM = m + 1;
  const nextY = nextM > 11 ? y + 1 : y;
  const nextMonthIndex = nextM % 12;
  const nextDay = clampDayInMonth(paymentDay, nextY, nextMonthIndex);
  const daysLeftThisMonth = new Date(y, m + 1, 0).getDate() - today;
  return daysLeftThisMonth + nextDay;
}

function ddayLabel(days: number): string {
  if (days === 0) return '오늘';
  if (days === 1) return '내일';
  return `D-${days}`;
}

function formatList(names: string[], max = 3): string {
  if (names.length <= max) return names.join(', ');
  return `${names.slice(0, max).join(', ')} 외 ${names.length - max}건`;
}

/**
 * 카드 비서 인사이트 생성
 * A: 카드 결제일 D-day + 결제은행
 * B: 월 경계 자동이체 + 남은 이체 합계
 * C: 설정 토글 필터 + 우선순위/개수 제한
 */
export function buildFinanceInsights(
  cards: Card[],
  autoTransfers: AutoTransfer[],
  settings: Settings,
  from: Date = new Date()
): FinanceInsight[] {
  const raw: FinanceInsight[] = [];
  const today = from.getDate();
  const y = from.getFullYear();
  const m = from.getMonth();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysLeftInMonth = daysInMonth - today;

  // ── B: 자동이체 (월 경계 포함 D-day) ─────────────────────────────────────
  if (settings.paymentAlert && autoTransfers.length > 0) {
    const withDays = autoTransfers.map((t) => ({
      ...t,
      days: daysUntilMonthlyDay(t.paymentDate, from),
    }));

    const todayTransfers = withDays.filter((t) => t.days === 0);
    if (todayTransfers.length > 0) {
      const amount = todayTransfers.reduce((s, t) => s + t.amount, 0);
      raw.push({
        id: 'auto-transfer-today',
        title: '오늘 자동이체 출금일',
        message: `${formatList(todayTransfers.map((t) => t.name))} 총 ${amount.toLocaleString()}원 출금 예정입니다.`,
        isUrgent: true,
        priority: 10,
        nav: 'transfer',
      });
    }

    const upcoming = withDays
      .filter((t) => t.days > 0 && t.days <= DDAY_WINDOW)
      .sort((a, b) => a.days - b.days || a.paymentDate - b.paymentDate);

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const monthHint =
        next.paymentDate < today
          ? `다음 달 ${next.paymentDate}일`
          : `${next.paymentDate}일`;
      raw.push({
        id: 'auto-transfer-upcoming',
        title: `다가오는 자동이체 · ${ddayLabel(next.days)}`,
        message: `${monthHint} ${next.name} ${next.amount.toLocaleString()}원${
          upcoming.length > 1 ? ` 외 ${upcoming.length - 1}건` : ''
        } 예정.`,
        isUrgent: next.days <= 1,
        priority: 20 + next.days,
        nav: 'transfer',
      });
    }

    // 이번 달 남은 자동이체 합계 (오늘 포함 이후 일자)
    const remainingThisMonth = autoTransfers.filter((t) => {
      const day = clampDayInMonth(t.paymentDate, y, m);
      return day >= today;
    });
    if (remainingThisMonth.length > 0) {
      const sum = remainingThisMonth.reduce((s, t) => s + t.amount, 0);
      // 오늘 이체만 있고 이미 today 알림이 있어도, 남은 합계가 오늘만이면 중복 느낌 → 남은 일정이 있거나 합계 의미 있을 때
      const hasFuture = remainingThisMonth.some((t) => clampDayInMonth(t.paymentDate, y, m) > today);
      if (hasFuture || remainingThisMonth.length >= 2) {
        raw.push({
          id: 'auto-transfer-remaining',
          title: '이번 달 남은 자동이체',
          message: `${remainingThisMonth.length}건 · 합계 ${sum.toLocaleString()}원 (오늘~말일${
            daysLeftInMonth > 0 ? `, ${daysLeftInMonth}일 남음` : ''
          }).`,
          isUrgent: false,
          priority: 45,
          nav: 'transfer',
        });
      }
    }
  }

  // ── A: 카드 결제일 D-day + 결제은행 ──────────────────────────────────────
  if (settings.paymentAlert && cards.length > 0) {
    const dueCards = cards
      .map((c) => ({
        card: c,
        days: daysUntilMonthlyDay(c.paymentDate, from),
      }))
      .filter((x) => x.days <= DDAY_WINDOW)
      .sort((a, b) => a.days - b.days || a.card.paymentDate - b.card.paymentDate);

    if (dueCards.length > 0) {
      const first = dueCards[0];
      const bankPart = first.card.paymentBank ? ` · ${first.card.paymentBank}` : '';
      const others = dueCards.length > 1 ? ` 외 ${dueCards.length - 1}장` : '';
      const amountPart =
        first.card.expectedPayment > 0
          ? ` 예정 ${first.card.expectedPayment.toLocaleString()}원`
          : '';

      raw.push({
        id: 'card-payment-dday',
        title:
          first.days === 0
            ? '오늘 카드 결제일'
            : `카드 결제일 · ${ddayLabel(first.days)}`,
        message: `${first.card.name}${others}${bankPart}${amountPart}. 출금 잔고를 확인해 주세요.`,
        isUrgent: first.days <= 1,
        priority: 15 + first.days,
        nav: 'cards',
      });
    }

    // 결제예정액 합계 (입력된 경우)
    const cardPaymentTotal = cards.reduce((s, c) => s + (c.expectedPayment || 0), 0);
    if (cardPaymentTotal > 0) {
      raw.push({
        id: 'card-payment-total',
        title: '카드 결제 예정 합계',
        message: `등록 카드 결제 예정 총 ${cardPaymentTotal.toLocaleString()}원입니다.`,
        isUrgent: cardPaymentTotal >= 1_000_000,
        priority: 50,
        nav: 'cards',
      });
    }
  }

  // ── C: 실적 부족 (설정 연동) ──────────────────────────────────────────────
  if (settings.performanceAlert) {
    const shortCards = cards
      .filter((c) => c.targetPerformance > 0 && c.currentPerformance < c.targetPerformance)
      .map((c) => ({
        card: c,
        shortage: c.targetPerformance - c.currentPerformance,
        ratio: c.currentPerformance / c.targetPerformance,
      }))
      .sort((a, b) => a.ratio - b.ratio);

    if (shortCards.length > 0) {
      const top = shortCards[0];
      const more =
        shortCards.length > 1 ? ` (미달 ${shortCards.length}장)` : '';
      raw.push({
        id: 'perf-shortage',
        title: '실적 미달',
        message: `${top.card.name} 실적 ${top.shortage.toLocaleString()}원 부족${more}.`,
        isUrgent: top.ratio < 0.5,
        priority: 30,
        nav: 'cards',
      });
    }
  }

  // ── C: 연회비 알림 (설정 연동) ───────────────────────────────────────────
  if (settings.annualFeeAlert) {
    const feeCards = cards.filter((c) => (c.annualFee || 0) > 0);
    if (feeCards.length > 0) {
      const totalFee = feeCards.reduce((s, c) => s + c.annualFee, 0);
      // 실적 거의 없는 유료 카드 우선 언급
      const idle = feeCards.find(
        (c) => c.targetPerformance > 0 && c.currentPerformance < c.targetPerformance * 0.1
      );
      raw.push({
        id: 'annual-fee',
        title: '연회비 안내',
        message: idle
          ? `${idle.name} 연회비 ${idle.annualFee.toLocaleString()}원 · 실적 사용이 저조합니다. 전체 연회비 합 ${totalFee.toLocaleString()}원.`
          : `보유 카드 연회비 합계 ${totalFee.toLocaleString()}원 (${feeCards.length}장).`,
        isUrgent: false,
        priority: 70,
        nav: 'cards',
      });
    }
  }

  // ── C: 월간 리포트 톤 알림 (설정 연동) ─────────────────────────────────
  if (settings.reportAlert && (cards.length > 0 || autoTransfers.length > 0)) {
    const cardPay = cards.reduce((s, c) => s + (c.expectedPayment || 0), 0);
    const transferRemain = autoTransfers
      .filter((t) => clampDayInMonth(t.paymentDate, y, m) >= today)
      .reduce((s, t) => s + t.amount, 0);
    const monthBurden = cardPay + transferRemain;
    if (monthBurden > 0) {
      raw.push({
        id: 'monthly-report',
        title: `${m + 1}월 금융 요약`,
        message: `카드 결제예정 ${cardPay.toLocaleString()}원 + 남은 자동이체 ${transferRemain.toLocaleString()}원 = ${monthBurden.toLocaleString()}원.`,
        isUrgent: false,
        priority: 80,
        nav: 'analysis',
      });
    }
  }

  // 우선순위 정렬 → 개수 제한 (긴급 우선 tie-break)
  raw.sort((a, b) => {
    if (a.isUrgent !== b.isUrgent) return a.isUrgent ? -1 : 1;
    return a.priority - b.priority;
  });

  return raw.slice(0, MAX_INSIGHTS);
}
