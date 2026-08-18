/** 금액 입력용 포맷 유틸 — 표시는 콤마, 저장은 number */

export function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function formatAmountInput(value: string): string {
  const digits = digitsOnly(value);
  if (!digits) return '';
  // 앞자리 0 제거 (단, "0" 단독은 허용)
  const normalized = digits.replace(/^0+(?=\d)/, '');
  return Number(normalized).toLocaleString('ko-KR');
}

export function parseAmountInput(value: string): number {
  const digits = digitsOnly(value);
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function amountToInputString(amount: number): string {
  if (!amount && amount !== 0) return '';
  if (amount === 0) return '0';
  return amount.toLocaleString('ko-KR');
}
