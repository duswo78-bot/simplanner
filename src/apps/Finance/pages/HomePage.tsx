import { CreditCard, Plus, RefreshCw, Sparkles, ChevronRight, Share2 } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface HomePageProps {
  store: ReturnType<typeof useFinanceStore>;
  onNavigate: (page: string) => void;
}

/** 인사이트 id → 이동 화면 (nav 필드 없을 때 폴백) */
const INSIGHT_NAV_FALLBACK: Record<string, string> = {
  'auto-transfer-today': 'transfer',
  'auto-transfer-upcoming': 'transfer',
  'auto-transfer-remaining': 'transfer',
  'card-payment-dday': 'cards',
  'card-payment-total': 'cards',
  'perf-shortage': 'cards',
  'annual-fee': 'cards',
  'monthly-report': 'analysis',
};

export function HomePage({ store, onNavigate }: HomePageProps) {
  const currentMonth = new Date().getMonth() + 1;
  const cardTotal = store.cards.reduce((s, c) => s + c.expectedPayment, 0);
  const transferTotal = store.totalMonthlyAutoTransfer;
  const total = store.totalExpectedPayment;
  const hasData = store.cards.length > 0 || store.autoTransfers.length > 0;

  const cardShare = total > 0 ? (cardTotal / total) * 100 : 0;
  const transferShare = total > 0 ? (transferTotal / total) * 100 : 0;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '내 카드 비서',
          text: `${currentMonth}월 결제 예정 ${total.toLocaleString()}원`,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('공유 링크가 클립보드에 복사되었습니다.');
      }
    } catch {
      // 공유 취소
    }
  };

  return (
    <div className="finance-home-page f-page animate-fade-in">
      <div className="f-page-header">
        <h2>{currentMonth}월의 리포트</h2>
        <button type="button" className="f-btn-text" onClick={handleShare} aria-label="공유">
          <Share2 size={20} />
        </button>
      </div>

      {/* KPI */}
      <div className="f-card f-kpi">
        <div className="f-kpi-total-label">이번 달 결제 예정액</div>
        <div className="f-kpi-total-value">{total.toLocaleString()}원</div>

        {hasData ? (
          <>
            <div className="f-kpi-split">
              <button type="button" className="f-kpi-cell" onClick={() => onNavigate('cards')}>
                <div className="f-kpi-cell-label">
                  <CreditCard size={12} /> 카드 결제
                </div>
                <div className="f-kpi-cell-value">{cardTotal.toLocaleString()}원</div>
              </button>
              <button type="button" className="f-kpi-cell" onClick={() => onNavigate('transfer')}>
                <div className="f-kpi-cell-label">
                  <RefreshCw size={12} /> 자동이체
                </div>
                <div className="f-kpi-cell-value">{transferTotal.toLocaleString()}원</div>
              </button>
            </div>

            <div className="f-kpi-bar" aria-hidden>
              {cardShare > 0 && <div className="f-kpi-bar-card" style={{ width: `${cardShare}%` }} />}
              {transferShare > 0 && <div className="f-kpi-bar-transfer" style={{ width: `${transferShare}%` }} />}
            </div>
            <div className="f-kpi-legend">
              <span><i className="f-kpi-dot f-kpi-dot-card" /> 카드 {Math.round(cardShare)}%</span>
              <span><i className="f-kpi-dot f-kpi-dot-transfer" /> 이체 {Math.round(transferShare)}%</span>
            </div>

            {store.accounts.length > 0 && (
              <div style={{ borderTop: '1px solid var(--f-border)', marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--f-text-tertiary)', marginBottom: 2 }}>등록 계좌 잔액</div>
                  <div className="tabular" style={{ fontSize: '0.95rem', fontWeight: 600 }}>{store.totalBalance.toLocaleString()}원</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--f-text-tertiary)', marginBottom: 2 }}>월말 예상 잔액</div>
                  <div className="tabular" style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: store.expectedMonthlyBalance >= 0 ? '#34d399' : '#f87171',
                  }}>
                    {store.expectedMonthlyBalance.toLocaleString()}원
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="f-kpi-empty">
            카드나 자동이체를 등록하면 결제 예정액이 표시됩니다.
          </div>
        )}
      </div>

      {/* Quick actions — 하단 탭과 중복 제거, 실제 액션만 */}
      <h3 className="f-section-title">빠른 실행</h3>
      <div className="f-quick-grid">
        <button type="button" className="f-quick-item" onClick={() => onNavigate('cards')}>
          <div className="f-quick-icon f-quick-icon-card"><Plus size={18} /></div>
          카드 관리
        </button>
        <button type="button" className="f-quick-item" onClick={() => onNavigate('transfer')}>
          <div className="f-quick-icon f-quick-icon-transfer"><RefreshCw size={18} /></div>
          이체 등록
        </button>
        <button type="button" className="f-quick-item" onClick={() => onNavigate('benefits')}>
          <div className="f-quick-icon f-quick-icon-benefit"><Sparkles size={18} /></div>
          혜택 검색
        </button>
      </div>

      {/* Insights — 탭 가능한 항목만 chevron */}
      <h3 className="f-section-title">
        <Sparkles size={18} color="#8b5cf6" /> 카드 비서
      </h3>

      <div className="f-insight-stack">
        {store.aiInsights.length === 0 ? (
          <div className="f-card f-empty" style={{ marginBottom: 0 }}>
            카드·자동이체를 등록하고 설정에서 알림을 켜 두면 비서가 알려 드립니다.
          </div>
        ) : (
          store.aiInsights.map((insight) => {
            const target =
              ('nav' in insight && insight.nav) ||
              INSIGHT_NAV_FALLBACK[insight.id];
            const body = (
              <>
                <div>
                  <div className="f-insight-title">{insight.title}</div>
                  <div className="f-insight-msg">{insight.message}</div>
                </div>
                {target && (
                  <ChevronRight
                    size={18}
                    color="var(--f-text-muted)"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                )}
              </>
            );

            if (target) {
              return (
                <button
                  key={insight.id}
                  type="button"
                  className={`f-card f-insight f-insight-clickable ${insight.isUrgent ? 'urgent' : ''}`}
                  onClick={() => onNavigate(String(target))}
                >
                  {body}
                </button>
              );
            }

            return (
              <div
                key={insight.id}
                className={`f-card f-insight ${insight.isUrgent ? 'urgent' : ''}`}
              >
                <div className="f-insight-title">{insight.title}</div>
                <div className="f-insight-msg">{insight.message}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
