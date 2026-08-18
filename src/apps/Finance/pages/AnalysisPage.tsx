import { useState, useMemo, useEffect } from 'react';
import { Search, PieChart, Zap, CreditCard } from 'lucide-react';
import { useFinanceStore, CARD_CATALOG } from '../FinanceStore';

interface AnalysisPageProps {
  store: ReturnType<typeof useFinanceStore>;
  initialTab?: 'consumption' | 'benefits';
}

const RESULT_LIMIT = 24;

export function AnalysisPage({ store, initialTab = 'consumption' }: AnalysisPageProps) {
  const [activeTab, setActiveTab] = useState<'consumption' | 'benefits'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const currentMonth = new Date().getMonth() + 1;
  const catalogSize = CARD_CATALOG.length;

  // 등록된 자동이체 카테고리 합산 (실제 사용자 데이터만)
  const transferByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of store.autoTransfers) {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [store.autoTransfers]);

  const totalTransfer = transferByCategory.reduce((s, c) => s + c.amount, 0);
  const categoryColors = ['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#a78bfa', '#94a3b8'];

  /** 2,800+ 카탈로그 혜택/카드명 검색 — 보유 카드 우선 */
  const { matches: benefitMatches, totalMatchCount } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { matches: [] as Array<{
      name: string;
      company: string;
      benefits: string[];
      isOwned: boolean;
      score: number;
    }>, totalMatchCount: 0 };

    const ownedKeys = new Set(store.cards.map(c => `${c.company}::${c.name}`));
    const ownedNames = new Set(store.cards.map(c => c.name));

    // 보유 카드 우선, 카탈로그 중복 제거
    const pool = [
      ...store.cards,
      ...CARD_CATALOG.filter(c => !ownedNames.has(c.name) || !ownedKeys.has(`${c.company}::${c.name}`)),
    ];

    const scored: Array<{
      name: string;
      company: string;
      benefits: string[];
      isOwned: boolean;
      score: number;
    }> = [];

    for (const card of pool) {
      const nameHit = card.name.toLowerCase().includes(q);
      const companyHit = card.company.toLowerCase().includes(q);
      const matchedBenefits = (card.benefits || []).filter(b =>
        b.toLowerCase().includes(q)
      );

      if (!nameHit && !companyHit && matchedBenefits.length === 0) continue;

      const isOwned = ownedKeys.has(`${card.company}::${card.name}`) || ownedNames.has(card.name);
      // 점수: 보유 > 카드명 매칭 > 혜택 매칭 수
      let score = 0;
      if (isOwned) score += 1000;
      if (nameHit) score += 100;
      if (companyHit) score += 20;
      score += matchedBenefits.length * 10;

      scored.push({
        name: card.name,
        company: card.company,
        benefits: matchedBenefits.length > 0
          ? matchedBenefits.slice(0, 4)
          : (card.benefits || []).slice(0, 3),
        isOwned,
        score,
      });
    }

    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ko'));

    return {
      matches: scored.slice(0, RESULT_LIMIT),
      totalMatchCount: scored.length,
    };
  }, [searchQuery, store.cards]);

  return (
    <div className="finance-analysis-page f-page animate-fade-in">
      {/* Tabs */}
      <div style={{ display: 'flex', background: 'var(--f-bg-elevated)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('consumption')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
            background: activeTab === 'consumption' ? 'var(--f-bg-subtle)' : 'transparent',
            color: activeTab === 'consumption' ? 'var(--f-text-primary)' : 'var(--f-text-muted)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          정기 지출
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('benefits')}
          style={{
            flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none',
            background: activeTab === 'benefits' ? 'var(--f-bg-subtle)' : 'transparent',
            color: activeTab === 'benefits' ? 'var(--f-text-primary)' : 'var(--f-text-muted)',
            fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          혜택 검색
        </button>
      </div>

      {/* 정기 지출 */}
      {activeTab === 'consumption' && (
        <div className="animate-fade-in">
          <div className="f-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--f-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={18} color="#3b82f6" /> {currentMonth}월 자동이체 분석
            </h3>

            {transferByCategory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--f-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                등록된 자동이체가 없습니다.<br />
                자동이체 탭에서 항목을 추가하면 카테고리별 합계가 표시됩니다.
              </div>
            ) : (
              <>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--f-text-primary)', marginBottom: '4px' }} className="tabular">
                  {totalTransfer.toLocaleString()}원
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '20px' }}>
                  등록된 자동이체 {store.autoTransfers.length}건 합계
                </div>

                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                  {transferByCategory.map((c, i) => (
                    <div
                      key={c.name}
                      style={{
                        width: `${(c.amount / totalTransfer) * 100}%`,
                        height: '100%',
                        background: categoryColors[i % categoryColors.length],
                      }}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {transferByCategory.map((c, i) => {
                    const percent = Math.round((c.amount / totalTransfer) * 100);
                    return (
                      <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: categoryColors[i % categoryColors.length] }} />
                          <span style={{ fontSize: '0.9rem', color: 'var(--f-text-tertiary)' }}>{c.name}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--f-text-muted)' }}>{percent}%</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--f-text-primary)' }} className="tabular">
                          {c.amount.toLocaleString()}원
                        </div>
                      </div>
                    );
                  })}
                </div>

                {store.cards.length > 0 && (
                  <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CreditCard size={14} /> 보유 카드
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--f-text-secondary)', lineHeight: 1.5 }}>
                      카드 {store.cards.length}장 · 연회비 합계 {store.totalAnnualFee.toLocaleString()}원
                      {store.cards.some(c => c.targetPerformance > 0 && c.currentPerformance < c.targetPerformance) && (
                        <> · 실적 미달 카드가 있습니다.</>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === 'benefits' && (
        <div className="animate-fade-in">
          <div className="f-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--f-text-secondary)' }}>
              어디서 결제하시나요?
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: '0.8rem', color: 'var(--f-text-tertiary)' }}>
              카드 카탈로그 {catalogSize.toLocaleString()}장에서 혜택·카드명을 검색합니다.
            </p>

            <div className="f-search-wrap">
              <Search size={18} className="f-search-icon" />
              <input
                className="f-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: 스타벅스, SKT, 주유, 배달"
                autoFocus={initialTab === 'benefits'}
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {['스타벅스', '주유', '배달', '교통', '통신', '편의점', '영화', 'SKT'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(tag)}
                  style={{
                    whiteSpace: 'nowrap',
                    background: searchQuery === tag ? 'rgba(99,102,241,0.2)' : 'var(--f-bg-subtle)',
                    border: 'none',
                    color: 'var(--f-text-secondary)',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {searchQuery && (
            benefitMatches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--f-text-muted)', padding: '0 4px' }}>
                  ‘{searchQuery}’ 매칭 {totalMatchCount.toLocaleString()}건
                  {totalMatchCount > RESULT_LIMIT ? ` · 상위 ${RESULT_LIMIT}건 표시` : ''}
                  {benefitMatches.some(m => m.isOwned) ? ' · 보유 카드 우선' : ''}
                </div>
                {benefitMatches.map((match) => (
                  <div key={`${match.company}-${match.name}`} className="f-card" style={{ padding: '16px', marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--f-text-muted)' }}>{match.company}</div>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--f-text-primary)' }}>{match.name}</div>
                      </div>
                      {match.isOwned && (
                        <span className="f-chip f-chip-ok">보유중</span>
                      )}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.85rem', color: 'var(--f-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {match.benefits.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="f-card" style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--f-text-muted)', fontSize: '0.9rem' }}>
                ‘{searchQuery}’와 매칭되는 혜택이 없습니다.
              </div>
            )
          )}

          {!searchQuery && (
            <div className="f-card" style={{ textAlign: 'center', padding: '28px 16px', color: 'var(--f-text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <Zap size={22} color="#8b5cf6" />
              가맹점·업종·카드명을 검색하면 혜택을 찾아드립니다.
              <span style={{ fontSize: '0.8rem' }}>
                {catalogSize.toLocaleString()}장 카탈로그
                {store.cards.length > 0 ? ' · 보유 카드가 위에 표시됩니다' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
