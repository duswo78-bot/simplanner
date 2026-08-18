import type { Card } from '../FinanceStore';
import { resolveCardGorillaId } from './cardGorilla';

export interface BenefitSection {
  title: string;
  summary: string;
  detail: string;
}

export interface CardBenefitDetail {
  sourceId: number;
  name: string;
  company: string;
  annualFeeText?: string;
  preMonthMoney?: number;
  topTags: string[];
  sections: BenefitSection[];
}

const CHUNK_SIZE = 100;

/** Vite: benefits 청크를 탭 시에만 로드 */
const benefitChunkLoaders = import.meta.glob('../data/benefits/*.json');

const chunkCache = new Map<string, Record<string, CardBenefitDetail>>();
const detailCache = new Map<number, CardBenefitDetail | null>();

function chunkFileName(sourceId: number): string {
  return `${Math.floor(sourceId / CHUNK_SIZE)}.json`;
}

function findLoader(sourceId: number) {
  const file = chunkFileName(sourceId);
  const key = Object.keys(benefitChunkLoaders).find((k) => k.endsWith(`/benefits/${file}`));
  return key ? benefitChunkLoaders[key] : null;
}

/** 탭 시 호출 — 해당 청크만 동적 import 후 캐시 */
export async function loadCardBenefitDetail(
  sourceId: number | null | undefined
): Promise<CardBenefitDetail | null> {
  if (sourceId == null || sourceId <= 0) return null;

  if (detailCache.has(sourceId)) {
    return detailCache.get(sourceId) ?? null;
  }

  const chunkKey = String(Math.floor(sourceId / CHUNK_SIZE));
  let chunk = chunkCache.get(chunkKey);

  if (!chunk) {
    const loader = findLoader(sourceId);
    if (!loader) {
      detailCache.set(sourceId, null);
      return null;
    }
    try {
      const mod = (await loader()) as { default?: Record<string, CardBenefitDetail> } & Record<
        string,
        CardBenefitDetail
      >;
      chunk = (mod.default ?? mod) as Record<string, CardBenefitDetail>;
      chunkCache.set(chunkKey, chunk);
    } catch (e) {
      console.error('Failed to load benefit chunk', sourceId, e);
      detailCache.set(sourceId, null);
      return null;
    }
  }

  const detail = chunk[String(sourceId)] ?? null;
  detailCache.set(sourceId, detail);
  return detail;
}

export async function loadBenefitDetailForCard(
  card: Pick<Card, 'id' | 'sourceId' | 'name' | 'company'>
): Promise<CardBenefitDetail | null> {
  const sourceId = resolveCardGorillaId(card);
  return loadCardBenefitDetail(sourceId);
}

export function hasLocalBenefitChunk(sourceId: number | null | undefined): boolean {
  if (sourceId == null || sourceId <= 0) return false;
  return Boolean(findLoader(sourceId));
}
