import type { Card } from '../FinanceStore';
import { CARD_CATALOG } from '../FinanceStore';

function findCatalogMatch(card: Pick<Card, 'name' | 'company' | 'id'>) {
  return CARD_CATALOG.find(
    (c) =>
      c.id === card.id ||
      (c.name === card.name && c.company === card.company)
  );
}

/** 보유/카탈로그 카드에서 카드고릴라 detail ID 추출 */
export function resolveCardGorillaId(card: Pick<Card, 'id' | 'sourceId' | 'name' | 'company'>): number | null {
  if (typeof card.sourceId === 'number' && card.sourceId > 0) {
    return card.sourceId;
  }

  const fromId = String(card.id || '').match(/^cg-(\d+)$/i);
  if (fromId) return Number(fromId[1]);

  const match = findCatalogMatch(card);
  if (match) {
    if (typeof match.sourceId === 'number' && match.sourceId > 0) return match.sourceId;
    const m = String(match.id || '').match(/^cg-(\d+)$/i);
    if (m) return Number(m[1]);
  }

  return null;
}

export function cardGorillaUrl(sourceId: number): string {
  return `https://m.card-gorilla.com/card/detail/${sourceId}`;
}

/** 상세 보기 URL: 공식 URL 우선, 없으면 카드고릴라 */
export function resolveCardDetailUrl(
  card: Pick<Card, 'id' | 'sourceId' | 'name' | 'company' | 'officialUrl'>
): string | null {
  if (card.officialUrl) return card.officialUrl;

  const match = findCatalogMatch(card);
  if (match?.officialUrl) return match.officialUrl;

  const gid = resolveCardGorillaId(card);
  if (gid) return cardGorillaUrl(gid);

  return null;
}
