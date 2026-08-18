import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Search, CheckCircle2, Trash2, CreditCard, Pencil,
  ExternalLink, X, ChevronRight, ChevronDown,
} from 'lucide-react';
import { useFinanceStore, CARD_CATALOG } from '../FinanceStore';
import type { Card } from '../FinanceStore';
import { amountToInputString, formatAmountInput, parseAmountInput } from '../utils/amountFormat';
import { cardFaceStyle } from '../utils/cardTheme';
import { resolveCardDetailUrl, resolveCardGorillaId } from '../utils/cardGorilla';
import {
  loadBenefitDetailForCard,
  type CardBenefitDetail,
} from '../utils/cardBenefits';

interface CardPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

interface EditForm {
  paymentDate: number;
  paymentBank: string;
  currentPerformance: string;
  targetPerformance: string;
  expectedPayment: string;
  annualFee: string;
}

const PAYMENT_BANKS = [
  'KB국민은행',
  '신한은행',
  '우리은행',
  '하나은행',
  'NH농협은행',
  'IBK기업은행',
  '카카오뱅크',
  '토스뱅크',
  '케이뱅크',
  'SC제일은행',
  '씨티은행',
  '부산은행',
  '대구은행',
  '경남은행',
  '광주은행',
  '전북은행',
  '제주은행',
  '우체국',
  '새마을금고',
  '신협',
  '수협은행',
];

function AmountField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const parsed = parseAmountInput(value);
  return (
    <div>
      <label className="f-label">{label}</label>
      <div className="f-amount-field">
        <input
          className="f-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={value}
          onChange={e => onChange(formatAmountInput(e.target.value))}
          placeholder={placeholder || '0'}
        />
        <span className="f-amount-suffix">원</span>
      </div>
      {value !== '' && parsed > 0 && (
        <div className="f-amount-hint">{parsed.toLocaleString('ko-KR')}원</div>
      )}
    </div>
  );
}

export function CardPage({ store }: CardPageProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const [registerMode, setRegisterMode] = useState<'catalog' | 'custom'>('catalog');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [registerPaymentDate, setRegisterPaymentDate] = useState(14);
  const [registerPaymentBank, setRegisterPaymentBank] = useState('');
  const [customForm, setCustomForm] = useState({
    company: '롯데카드',
    name: '',
    annualFee: '0',
    targetPerformance: '300,000',
    benefits: '',
    image: '',
    officialUrl: '',
  });
  const [detailView, setDetailView] = useState<{ title: string; url: string } | null>(null);
  const [benefitSheet, setBenefitSheet] = useState<{
    card: Card;
    loading: boolean;
    detail: CardBenefitDetail | null;
    externalUrl: string | null;
  } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  const COMPANIES = Array.from(new Set(CARD_CATALOG.map(c => c.company))).sort((a, b) =>
    a.localeCompare(b, 'ko')
  );

  const searchResults = CARD_CATALOG.filter(c => {
    if (selectedCompany && c.company !== selectedCompany) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setEditForm({
      paymentDate: card.paymentDate,
      paymentBank: card.paymentBank || '',
      currentPerformance: amountToInputString(card.currentPerformance),
      targetPerformance: amountToInputString(card.targetPerformance),
      expectedPayment: amountToInputString(card.expectedPayment),
      annualFee: amountToInputString(card.annualFee),
    });
  };

  const closeEdit = () => {
    setEditingCard(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (!editingCard || !editForm) return;
    const bank = editForm.paymentBank.trim();
    store.updateCard(editingCard.id, {
      paymentDate: Math.min(31, Math.max(1, Number(editForm.paymentDate) || 1)),
      paymentBank: bank || undefined,
      currentPerformance: parseAmountInput(editForm.currentPerformance),
      targetPerformance: parseAmountInput(editForm.targetPerformance),
      expectedPayment: parseAmountInput(editForm.expectedPayment),
      annualFee: parseAmountInput(editForm.annualFee),
    });
    closeEdit();
  };

  const resetRegisterState = () => {
    setShowRegister(false);
    setRegisterMode('catalog');
    setSelectedCard(null);
    setSelectedCompany('');
    setSearchQuery('');
    setRegisterPaymentDate(14);
    setRegisterPaymentBank('');
    setCustomForm({
      company: '롯데카드',
      name: '',
      annualFee: '0',
      targetPerformance: '300,000',
      benefits: '',
      image: '',
      officialUrl: '',
    });
  };

  const registerSelectedCard = () => {
    if (!selectedCard) return;

    const sourceId = resolveCardGorillaId(selectedCard) ?? undefined;
    const bank = registerPaymentBank.trim();

    store.addCard({
      company: selectedCard.company,
      name: selectedCard.name,
      annualFee: selectedCard.annualFee,
      targetPerformance: selectedCard.targetPerformance || 300000,
      currentPerformance: 0,
      benefits: selectedCard.benefits,
      image: selectedCard.image,
      paymentDate: registerPaymentDate,
      paymentBank: bank || undefined,
      expectedPayment: 0,
      sourceId,
      category: selectedCard.category,
      source: selectedCard.source || 'card-gorilla',
      officialUrl: selectedCard.officialUrl,
      productCode: selectedCard.productCode,
    });

    resetRegisterState();
  };

  const registerCustomCard = () => {
    const name = customForm.name.trim();
    const company = customForm.company.trim() || '기타';
    if (!name) return;

    const benefits = customForm.benefits
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);
    const bank = registerPaymentBank.trim();

    store.addCard({
      company,
      name,
      annualFee: parseAmountInput(customForm.annualFee),
      targetPerformance: parseAmountInput(customForm.targetPerformance) || 300000,
      currentPerformance: 0,
      benefits: benefits.length > 0 ? benefits : ['직접 등록 카드'],
      image: customForm.image.trim(),
      paymentDate: registerPaymentDate,
      paymentBank: bank || undefined,
      expectedPayment: 0,
      category: '신용',
      source: 'manual',
      officialUrl: customForm.officialUrl.trim() || undefined,
    });

    resetRegisterState();
  };

  const openExternalDetail = (card: Card, url?: string | null) => {
    const target = url || resolveCardDetailUrl(card);
    if (!target) {
      alert('이 카드의 상세 링크를 찾을 수 없습니다.');
      return;
    }
    setDetailView({ title: card.name, url: target });
  };

  /** 주요 혜택 탭 → 로컬 DB 우선, 없으면 웹뷰 폴백 */
  const openBenefits = async (card: Card) => {
    const externalUrl = resolveCardDetailUrl(card);
    const sourceId = resolveCardGorillaId(card);

    setExpandedSections({});
    setBenefitSheet({ card, loading: true, detail: null, externalUrl });

    if (!sourceId) {
      setBenefitSheet({ card, loading: false, detail: null, externalUrl });
      if (externalUrl) {
        // 로컬 상세 없음 → 바로 웹뷰
        setBenefitSheet(null);
        openExternalDetail(card, externalUrl);
      }
      return;
    }

    try {
      const detail = await loadBenefitDetailForCard(card);
      if (detail && (detail.sections.length > 0 || detail.topTags.length > 0)) {
        setBenefitSheet({ card, loading: false, detail, externalUrl });
      } else if (externalUrl) {
        setBenefitSheet(null);
        openExternalDetail(card, externalUrl);
      } else {
        setBenefitSheet({ card, loading: false, detail: null, externalUrl });
      }
    } catch {
      if (externalUrl) {
        setBenefitSheet(null);
        openExternalDetail(card, externalUrl);
      } else {
        setBenefitSheet({ card, loading: false, detail: null, externalUrl: null });
      }
    }
  };

  const handleRemove = (card: Card, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`‘${card.name}’ 카드를 삭제할까요?`)) {
      store.removeCard(card.id);
    }
  };

  const portalRoot = () => document.querySelector('.finance-app') || document.body;

  return (
    <div className="finance-card-page f-page animate-fade-in">
      <div className="f-page-header">
        <h2>
          보유 카드 <span style={{ color: '#818cf8' }}>{store.cards.length}</span>
        </h2>
        <button type="button" className="f-btn-text" onClick={() => setShowRegister(true)}>
          <Plus size={18} /> 추가
        </button>
      </div>

      {store.cards.length === 0 ? (
        <div className="f-card f-empty">
          <div className="f-empty-icon"><CreditCard size={32} /></div>
          <div>등록된 카드가 없습니다.</div>
          <div style={{ fontSize: '0.8rem', marginTop: 6, marginBottom: 16 }}>카드를 추가하고 실적·결제예정액을 관리하세요.</div>
          <button type="button" className="f-btn-primary" onClick={() => setShowRegister(true)} style={{ maxWidth: 200, margin: '0 auto' }}>
            카드 추가하기
          </button>
        </div>
      ) : (
        <div className="f-plastic-wrap">
          {store.cards.map((card) => {
            const target = card.targetPerformance || 0;
            const isAchieved = target > 0 && card.currentPerformance >= target;
            const perfRatio = target > 0
              ? Math.min((card.currentPerformance / target) * 100, 100)
              : 0;
            const remaining = Math.max(0, target - card.currentPerformance);

            const canOpenBenefits =
              Boolean(resolveCardGorillaId(card)) || Boolean(resolveCardDetailUrl(card));

            return (
              <article key={card.id} className="f-plastic-item">
                <div className="f-plastic-face" style={cardFaceStyle(card.company)}>
                  {card.image ? (
                    <img
                      className="f-plastic-bg-img"
                      src={card.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="f-plastic-top">
                    <span className="f-plastic-company">{card.company}</span>
                    <div className="f-plastic-actions">
                      <button
                        type="button"
                        onClick={() => openEdit(card)}
                        aria-label={`${card.name} 수정`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleRemove(card, e)}
                        aria-label={`${card.name} 삭제`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="f-plastic-name">{card.name}</div>
                  <div className="f-plastic-meta">
                    <div>
                      <div>매월 {card.paymentDate}일 결제</div>
                      {card.paymentBank ? (
                        <div style={{ fontSize: '0.72rem', opacity: 0.88, marginTop: 3 }}>
                          {card.paymentBank}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.68rem', opacity: 0.85 }}>결제 예정</div>
                      <div className="f-plastic-amount">{card.expectedPayment.toLocaleString()}원</div>
                    </div>
                  </div>
                </div>

                <div className="f-plastic-body">
                  <div className="f-plastic-perf-head">
                    <span className="f-plastic-perf-label">실적 달성</span>
                    {target <= 0 ? (
                      <span className="f-chip f-chip-neutral">목표 미설정</span>
                    ) : isAchieved ? (
                      <span className="f-chip f-chip-ok">
                        <CheckCircle2 size={12} /> 달성
                      </span>
                    ) : (
                      <span className="f-chip f-chip-warn">
                        {remaining.toLocaleString()}원 남음
                      </span>
                    )}
                  </div>
                  <div className="f-plastic-bar">
                    <div
                      className={`f-plastic-bar-fill ${isAchieved ? 'done' : ''}`}
                      style={{ width: `${perfRatio}%` }}
                    />
                  </div>
                  <div className="f-plastic-perf-foot">
                    <span>현재 {card.currentPerformance.toLocaleString()}원</span>
                    <span>목표 {card.targetPerformance.toLocaleString()}원</span>
                  </div>

                  {(card.benefits.length > 0 || canOpenBenefits) && (
                    <div className="f-plastic-benefits">
                      <button
                        type="button"
                        className="f-plastic-benefits-btn"
                        onClick={() => openBenefits(card)}
                        disabled={!canOpenBenefits && card.benefits.length === 0}
                        title={canOpenBenefits ? '저장된 상세 혜택 보기' : undefined}
                      >
                        <div className="f-plastic-benefits-title">
                          <span>주요 혜택 (요약)</span>
                          {canOpenBenefits ? (
                            <span className="f-plastic-benefits-link">
                              자세히 <ChevronRight size={14} />
                            </span>
                          ) : null}
                        </div>
                        <ul>
                          {(card.benefits.length > 0 ? card.benefits : ['상세 혜택 보기']).slice(0, 3).map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 로컬 혜택 상세 시트 */}
      {benefitSheet && createPortal(
        <div
          className="f-modal-backdrop"
          style={{ zIndex: 70 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBenefitSheet(null);
          }}
        >
          <div
            className="f-modal-sheet f-benefit-sheet"
            role="dialog"
            aria-labelledby="benefit-sheet-title"
          >
            <div className="f-modal-handle" />
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 id="benefit-sheet-title" className="f-modal-title" style={{ marginBottom: 2 }}>
                  {benefitSheet.card.name}
                </h3>
                <p className="f-modal-sub" style={{ marginBottom: 0 }}>
                  {benefitSheet.card.company}
                  {benefitSheet.detail?.annualFeeText
                    ? ` · ${benefitSheet.detail.annualFeeText}`
                    : ''}
                </p>
              </div>
              <button
                type="button"
                className="finance-icon-btn"
                onClick={() => setBenefitSheet(null)}
                aria-label="닫기"
              >
                <X size={20} />
              </button>
            </div>

            {benefitSheet.loading && (
              <div className="f-benefit-loading">혜택 정보를 불러오는 중…</div>
            )}

            {!benefitSheet.loading && benefitSheet.detail && (
              <>
                {benefitSheet.detail.topTags.length > 0 && (
                  <div className="f-benefit-tags">
                    {benefitSheet.detail.topTags.map((tag) => (
                      <span key={tag} className="f-benefit-tag">{tag}</span>
                    ))}
                  </div>
                )}

                {(benefitSheet.detail.preMonthMoney ?? 0) > 0 && (
                  <div className="f-benefit-meta">
                    전월실적 기준 안내: {Number(benefitSheet.detail.preMonthMoney).toLocaleString()}원
                  </div>
                )}

                <div className="f-benefit-sections">
                  {benefitSheet.detail.sections.map((section, idx) => {
                    const open = expandedSections[idx] ?? false;
                    const hasDetail = Boolean(section.detail);
                    return (
                      <div key={`${section.title}-${idx}`} className="f-benefit-section">
                        <button
                          type="button"
                          className="f-benefit-section-head"
                          onClick={() => {
                            if (!hasDetail) return;
                            setExpandedSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
                          }}
                          disabled={!hasDetail}
                          style={{ cursor: hasDetail ? 'pointer' : 'default' }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="f-benefit-section-title">{section.title}</div>
                            <div className="f-benefit-section-summary">
                              {section.summary || section.detail}
                            </div>
                          </div>
                          {hasDetail ? (
                            open ? <ChevronDown size={18} color="var(--f-text-muted)" /> : <ChevronRight size={18} color="var(--f-text-muted)" />
                          ) : null}
                        </button>
                        {open && section.detail && (
                          <div className="f-benefit-section-body">
                            <p className="f-benefit-section-detail">{section.detail}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!benefitSheet.loading && !benefitSheet.detail && (
              <div className="f-benefit-empty">
                저장된 상세 혜택이 없습니다.
                {benefitSheet.externalUrl ? ' 원문 페이지에서 확인해 주세요.' : ''}
              </div>
            )}

            <div className="f-modal-actions">
              <button
                type="button"
                className="f-btn-secondary"
                onClick={() => setBenefitSheet(null)}
              >
                닫기
              </button>
              {benefitSheet.externalUrl && (
                <button
                  type="button"
                  className="f-btn-primary"
                  onClick={() => {
                    const url = benefitSheet.externalUrl!;
                    const title = benefitSheet.card.name;
                    setBenefitSheet(null);
                    setDetailView({ title, url });
                  }}
                >
                  원문 보기
                </button>
              )}
            </div>
          </div>
        </div>,
        portalRoot()
      )}

      {/* 카드고릴라/공식 상세 웹뷰 (폴백·원문) */}
      {detailView && createPortal(
        <div className="f-webview-overlay" role="dialog" aria-label="카드 상세 혜택">
          <div className="f-webview-header">
            <button
              type="button"
              className="finance-icon-btn"
              onClick={() => setDetailView(null)}
              aria-label="닫기"
            >
              <X size={20} />
            </button>
            <h2>{detailView.title}</h2>
            <button
              type="button"
              className="finance-icon-btn"
              onClick={() => window.open(detailView.url, '_blank', 'noopener,noreferrer')}
              aria-label="새 창에서 열기"
              title="새 창에서 열기"
            >
              <ExternalLink size={18} />
            </button>
          </div>
          <iframe
            className="f-webview-frame"
            src={detailView.url}
            title={`${detailView.title} 카드고릴라 상세`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>,
        portalRoot()
      )}

      {/* Edit Modal */}
      {editingCard && editForm && createPortal(
        <div
          className="f-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}
        >
          <div className="f-modal-sheet" role="dialog" aria-labelledby="edit-card-title">
            <div className="f-modal-handle" />
            <h3 id="edit-card-title" className="f-modal-title">카드 정보 수정</h3>
            <p className="f-modal-sub">{editingCard.company} · {editingCard.name}</p>

            <div className="f-form-stack">
              <div className="f-form-row">
                <div>
                  <label className="f-label">결제일 (매월)</label>
                  <select
                    className="f-select"
                    value={editForm.paymentDate}
                    onChange={e => setEditForm({ ...editForm, paymentDate: Number(e.target.value) })}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}일</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="f-label">결제 은행</label>
                  <input
                    className="f-input"
                    list="f-payment-bank-list"
                    value={editForm.paymentBank}
                    onChange={e => setEditForm({ ...editForm, paymentBank: e.target.value })}
                    placeholder="예: 신한은행"
                  />
                  <datalist id="f-payment-bank-list">
                    {PAYMENT_BANKS.map(b => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>

              <AmountField
                label="결제 예정액"
                value={editForm.expectedPayment}
                onChange={v => setEditForm({ ...editForm, expectedPayment: v })}
                placeholder="이번 달 청구 예정"
              />

              <div className="f-form-row">
                <AmountField
                  label="현재 실적"
                  value={editForm.currentPerformance}
                  onChange={v => setEditForm({ ...editForm, currentPerformance: v })}
                />
                <AmountField
                  label="목표 실적"
                  value={editForm.targetPerformance}
                  onChange={v => setEditForm({ ...editForm, targetPerformance: v })}
                />
              </div>

              <AmountField
                label="연회비"
                value={editForm.annualFee}
                onChange={v => setEditForm({ ...editForm, annualFee: v })}
              />
            </div>

            <div className="f-modal-actions">
              <button type="button" onClick={closeEdit} className="f-btn-secondary">취소</button>
              <button type="button" onClick={saveEdit} className="f-btn-primary">저장</button>
            </div>
          </div>
        </div>,
        portalRoot()
      )}

      {/* Register Modal */}
      {showRegister && createPortal(
        <div
          className="f-modal-backdrop"
          style={{ zIndex: 50 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) resetRegisterState();
          }}
        >
          <div className="f-modal-sheet" role="dialog" aria-labelledby="reg-card-title" style={{ maxHeight: '85vh' }}>
            <div className="f-modal-handle" />
            <h3 id="reg-card-title" className="f-modal-title">새 카드 등록</h3>

            <div className="f-register-tabs">
              <button
                type="button"
                className={registerMode === 'catalog' ? 'active' : ''}
                onClick={() => setRegisterMode('catalog')}
              >
                목록에서 찾기
              </button>
              <button
                type="button"
                className={registerMode === 'custom' ? 'active' : ''}
                onClick={() => setRegisterMode('custom')}
              >
                직접 등록
              </button>
            </div>

            {registerMode === 'catalog' ? (
              <>
                <p className="f-modal-sub">카드사를 고르고 카드를 검색해 등록하세요.</p>
                <div className="f-form-stack" style={{ marginBottom: 12 }}>
                  <select
                    className="f-select"
                    value={selectedCompany}
                    onChange={e => setSelectedCompany(e.target.value)}
                  >
                    <option value="">모든 카드사</option>
                    {COMPANIES.map(comp => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>

                  <div className="f-search-wrap">
                    <Search size={18} className="f-search-icon" />
                    <input
                      className="f-input"
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="카드명 검색 (예: TELLO, 톡톡)"
                    />
                  </div>

                  <div className="f-form-row">
                    <div>
                      <label className="f-label">결제일 (매월)</label>
                      <select
                        className="f-select"
                        value={registerPaymentDate}
                        onChange={e => setRegisterPaymentDate(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="f-label">결제 은행</label>
                      <input
                        className="f-input"
                        list="f-payment-bank-list-reg"
                        value={registerPaymentBank}
                        onChange={e => setRegisterPaymentBank(e.target.value)}
                        placeholder="예: 신한은행"
                      />
                      <datalist id="f-payment-bank-list-reg">
                        {PAYMENT_BANKS.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="f-pick-list">
                  {searchResults.length > 0 ? (
                    <>
                      <div style={{ fontSize: '0.78rem', color: 'var(--f-text-tertiary)' }}>
                        검색 결과 {searchResults.length}건
                      </div>
                      {searchResults.map((card, i) => {
                        const selected =
                          selectedCard?.id === card.id ||
                          (selectedCard?.name === card.name && selectedCard?.company === card.company);
                        return (
                          <div
                            key={`${card.id || card.company}-${card.name}-${i}`}
                            className={`f-pick-item ${selected ? 'selected' : ''}`}
                            onClick={() => setSelectedCard(card)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === 'Enter') setSelectedCard(card); }}
                          >
                            <div className="f-pick-thumb">
                              {card.image ? (
                                <img src={card.image} alt="" />
                              ) : (
                                <CreditCard size={18} color="var(--f-text-tertiary)" />
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.72rem', color: 'var(--f-text-muted)' }}>{card.company}</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--f-text-primary)' }}>{card.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div className="f-empty" style={{ padding: '24px 0' }}>
                      해당하는 카드가 없습니다.
                      <div style={{ marginTop: 12 }}>
                        <button type="button" className="f-btn-text" onClick={() => setRegisterMode('custom')}>
                          직접 등록하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="f-modal-actions">
                  <button type="button" className="f-btn-secondary" onClick={resetRegisterState}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="f-btn-primary"
                    onClick={registerSelectedCard}
                    disabled={!selectedCard}
                  >
                    등록하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="f-modal-sub">카탈로그에 없는 카드를 직접 입력해 등록하세요.</p>
                <div className="f-form-stack">
                  <div>
                    <label className="f-label">카드사</label>
                    <input
                      className="f-input"
                      list="f-company-list"
                      value={customForm.company}
                      onChange={e => setCustomForm({ ...customForm, company: e.target.value })}
                      placeholder="예: 롯데카드"
                    />
                    <datalist id="f-company-list">
                      {COMPANIES.map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="f-label">카드 이름</label>
                    <input
                      className="f-input"
                      value={customForm.name}
                      onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                      placeholder="예: 롯데카드 TELLO SE"
                    />
                  </div>
                  <div className="f-form-row">
                    <div>
                      <label className="f-label">결제일 (매월)</label>
                      <select
                        className="f-select"
                        value={registerPaymentDate}
                        onChange={e => setRegisterPaymentDate(Number(e.target.value))}
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}일</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="f-label">결제 은행</label>
                      <input
                        className="f-input"
                        list="f-payment-bank-list-custom"
                        value={registerPaymentBank}
                        onChange={e => setRegisterPaymentBank(e.target.value)}
                        placeholder="예: 신한은행"
                      />
                      <datalist id="f-payment-bank-list-custom">
                        {PAYMENT_BANKS.map(b => (
                          <option key={b} value={b} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                  <div className="f-form-row">
                    <AmountField
                      label="연회비"
                      value={customForm.annualFee}
                      onChange={v => setCustomForm({ ...customForm, annualFee: v })}
                    />
                    <AmountField
                      label="목표 실적"
                      value={customForm.targetPerformance}
                      onChange={v => setCustomForm({ ...customForm, targetPerformance: v })}
                    />
                  </div>
                  <div>
                    <label className="f-label">주요 혜택 (줄바꿈 또는 콤마로 구분)</label>
                    <textarea
                      className="f-input f-textarea"
                      rows={3}
                      value={customForm.benefits}
                      onChange={e => setCustomForm({ ...customForm, benefits: e.target.value })}
                      placeholder={'예: SKT 통신요금 할인\n전월실적 40만원 이상'}
                    />
                  </div>
                  <div>
                    <label className="f-label">카드 이미지 URL (선택)</label>
                    <input
                      className="f-input"
                      value={customForm.image}
                      onChange={e => setCustomForm({ ...customForm, image: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="f-label">공식 상세 URL (선택)</label>
                    <input
                      className="f-input"
                      value={customForm.officialUrl}
                      onChange={e => setCustomForm({ ...customForm, officialUrl: e.target.value })}
                      placeholder="카드사 홈페이지 상품 링크"
                    />
                  </div>
                </div>
                <div className="f-modal-actions">
                  <button type="button" className="f-btn-secondary" onClick={resetRegisterState}>
                    취소
                  </button>
                  <button
                    type="button"
                    className="f-btn-primary"
                    onClick={registerCustomCard}
                    disabled={!customForm.name.trim()}
                  >
                    등록하기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>,
        portalRoot()
      )}
    </div>
  );
}
