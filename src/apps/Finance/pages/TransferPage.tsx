import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Wallet, Home, Phone, Shield, MonitorPlay, Plus, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';
import { formatAmountInput, parseAmountInput } from '../utils/amountFormat';
import { pushToAccountBook } from '../../shared/EventBus';

interface TransferPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

const CATEGORY_META: Record<string, { icon: ReactNode; bg: string; color: string }> = {
  '주거/공과금': { icon: <Home size={14} />, bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' },
  '통신': { icon: <Phone size={14} />, bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' },
  '보험': { icon: <Shield size={14} />, bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
  '구독': { icon: <MonitorPlay size={14} />, bg: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' },
};

type StatusKey = 'today' | 'upcoming' | 'done';

function getStatus(paymentDate: number, today: number): StatusKey {
  if (paymentDate === today) return 'today';
  if (paymentDate < today) return 'done';
  return 'upcoming';
}

const STATUS_CHIP: Record<StatusKey, { label: string; className: string }> = {
  today: { label: '오늘', className: 'f-chip f-chip-today' },
  upcoming: { label: '예정', className: 'f-chip f-chip-upcoming' },
  done: { label: '지남', className: 'f-chip f-chip-done' },
};

export function TransferPage({ store }: TransferPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '주거/공과금',
    paymentDate: 1,
    amount: '',
    paymentMethod: store.cards.length > 0 ? store.cards[0].name : '계좌이체',
  });

  const today = new Date().getDate();
  const sortedTransfers = [...store.autoTransfers].sort((a, b) => a.paymentDate - b.paymentDate);
  const totalMonthlyAuto = store.totalMonthlyAutoTransfer;

  const counts = {
    today: sortedTransfers.filter(t => t.paymentDate === today).length,
    upcoming: sortedTransfers.filter(t => t.paymentDate > today).length,
    done: sortedTransfers.filter(t => t.paymentDate < today).length,
  };

  const nextTransfer =
    sortedTransfers.find(t => t.paymentDate >= today) || sortedTransfers[0];

  const getCategoryMeta = (category: string) =>
    CATEGORY_META[category] || {
      icon: <Wallet size={14} />,
      bg: 'rgba(148, 163, 184, 0.15)',
      color: '#94a3b8',
    };

  const handleAddTransfer = () => {
    if (!formData.name || !formData.amount) return;
    const amount = parseAmountInput(formData.amount);
    if (amount <= 0) return;

    store.addAutoTransfer({
      name: formData.name,
      category: formData.category,
      paymentDate: Number(formData.paymentDate),
      amount,
      paymentMethod: formData.paymentMethod,
    });

    setShowAddForm(false);
    setFormData(prev => ({
      ...prev,
      name: '',
      amount: '',
      paymentMethod: store.cards.length > 0 ? store.cards[0].name : '계좌이체',
    }));
  };

  const openAddForm = () => {
    setFormData({
      name: '',
      category: '주거/공과금',
      paymentDate: Math.min(today, 28),
      amount: '',
      paymentMethod: store.cards.length > 0 ? store.cards[0].name : '계좌이체',
    });
    setShowAddForm(true);
  };

  const handleRemove = (id: string, name: string) => {
    if (window.confirm(`‘${name}’ 자동이체를 삭제할까요?`)) {
      store.removeAutoTransfer(id);
    }
  };

  const portalRoot = () => document.querySelector('.finance-app') || document.body;
  const canSubmit = Boolean(formData.name && parseAmountInput(formData.amount) > 0);

  return (
    <div className="finance-transfer-page f-page animate-fade-in">
      {/* Summary */}
      <div className="f-card f-tl-summary">
        <CalendarDays
          size={120}
          color="rgba(99, 102, 241, 0.06)"
          style={{ position: 'absolute', right: -16, bottom: -20 }}
        />
        <div className="f-tl-summary-label">이번 달 자동이체 예정 총액</div>
        <div className="f-tl-summary-value">{totalMonthlyAuto.toLocaleString()}원</div>
        <div className="f-tl-summary-chips">
          <span className="f-chip f-chip-neutral">총 {sortedTransfers.length}건</span>
          {counts.today > 0 && (
            <span className="f-chip f-chip-today">오늘 {counts.today}건</span>
          )}
          {counts.upcoming > 0 && (
            <span className="f-chip f-chip-upcoming">예정 {counts.upcoming}건</span>
          )}
          {counts.done > 0 && (
            <span className="f-chip f-chip-done">지남 {counts.done}건</span>
          )}
          {nextTransfer && nextTransfer.paymentDate >= today && (
            <span className="f-chip f-chip-upcoming">
              다음 {nextTransfer.paymentDate}일 {nextTransfer.name}
            </span>
          )}
        </div>
      </div>

      <h3 className="f-section-title" style={{ marginTop: 20 }}>자동이체 타임라인</h3>

      {sortedTransfers.length === 0 ? (
        <div className="f-card f-empty">
          등록된 자동이체가 없습니다.
          <div style={{ marginTop: 16 }}>
            <button type="button" className="f-btn-primary" onClick={openAddForm} style={{ maxWidth: 220, margin: '0 auto' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={18} /> 첫 자동이체 등록
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="f-timeline">
          {sortedTransfers.map((item) => {
            const status = getStatus(item.paymentDate, today);
            const meta = getCategoryMeta(item.category);
            const chip = STATUS_CHIP[status];

            return (
              <div
                key={item.id}
                className={`f-tl-item is-${status === 'done' ? 'past' : status}`}
              >
                <div className="f-tl-date">
                  <span className="f-tl-date-day">{item.paymentDate}</span>
                  <span className="f-tl-date-sub">
                    {status === 'today' ? '오늘' : '매월'}
                  </span>
                </div>

                <div className="f-tl-rail">
                  <div className="f-tl-dot" />
                  <div className="f-tl-line" />
                </div>

                <div className="f-tl-card">
                  <div className="f-tl-card-main">
                    <div className="f-tl-card-tags">
                      <span
                        className="f-cat-badge"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {item.category}
                      </span>
                      <span className={chip.className}>{chip.label}</span>
                    </div>
                    <div className="f-tl-card-name">{item.name}</div>
                    <div className="f-tl-card-method">
                      <Wallet size={12} /> {item.paymentMethod}
                    </div>
                  </div>
                  <div className="f-tl-card-side">
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="f-icon-btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem', borderRadius: '4px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none' }}
                        onClick={() => {
                          const success = pushToAccountBook({
                            type: 'expense',
                            amount: item.amount,
                            category: item.category,
                            date: new Date().toISOString().split('T')[0],
                            memo: `${item.name} (자동이체)`,
                          });
                          if (success) alert('가계부에 지출 내역으로 추가되었습니다.');
                        }}
                      >
                        가계부 기록
                      </button>
                      <button
                        type="button"
                        className="f-icon-btn-danger"
                        onClick={() => handleRemove(item.id, item.name)}
                        aria-label={`${item.name} 삭제`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="f-tl-card-amount">
                      {item.amount.toLocaleString()}원
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sortedTransfers.length > 0 && (
        <button type="button" onClick={openAddForm} className="f-btn-secondary f-add-block">
          <Plus size={18} />
          <span>새로운 자동이체 등록</span>
        </button>
      )}

      {/* Add Modal */}
      {showAddForm && createPortal(
        <div
          className="f-modal-backdrop"
          style={{ zIndex: 9999 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }}
        >
          <div className="f-modal-sheet" role="dialog" aria-labelledby="add-transfer-title">
            <div className="f-modal-handle" />
            <h3 id="add-transfer-title" className="f-modal-title">자동이체 항목 추가</h3>
            <p className="f-modal-sub">매월 반복되는 정기 결제를 등록하세요.</p>

            <div className="f-form-stack">
              <div>
                <label className="f-label">항목명</label>
                <input
                  className="f-input"
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: 넷플릭스, 관리비"
                />
              </div>

              <div>
                <label className="f-label">카테고리</label>
                <select
                  className="f-select"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="구독">구독 (OTT, 멤버십 등)</option>
                  <option value="주거/공과금">주거/공과금 (관리비, 가스 등)</option>
                  <option value="통신">통신비</option>
                  <option value="보험">보험료</option>
                  <option value="기타">기타 정기결제</option>
                </select>
              </div>

              <div>
                <label className="f-label">결제 금액</label>
                <div className="f-amount-field">
                  <input
                    className="f-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: formatAmountInput(e.target.value) })}
                    placeholder="0"
                  />
                  <span className="f-amount-suffix">원</span>
                </div>
                {formData.amount && parseAmountInput(formData.amount) > 0 && (
                  <div className="f-amount-hint">
                    {parseAmountInput(formData.amount).toLocaleString('ko-KR')}원
                  </div>
                )}
              </div>

              <div className="f-form-row">
                <div>
                  <label className="f-label">결제일 (매월)</label>
                  <select
                    className="f-select"
                    value={formData.paymentDate}
                    onChange={e => setFormData({ ...formData, paymentDate: Number(e.target.value) })}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}일</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 2 }}>
                  <label className="f-label">결제 수단</label>
                  {store.cards.length > 0 || store.accounts.length > 0 ? (
                    <select
                      className="f-select"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                    >
                      {store.cards.length > 0 && (
                        <optgroup label="내 카드">
                          {store.cards.map(card => (
                            <option key={card.id} value={card.name}>{card.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {store.accounts.length > 0 && (
                        <optgroup label="내 계좌">
                          {store.accounts.map(acc => (
                            <option key={acc.id} value={acc.alias || `${acc.bankName} ${acc.accountNumber}`}>
                              {acc.alias || `${acc.bankName} ${acc.accountNumber}`}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      <optgroup label="기타">
                        <option value="계좌이체">계좌이체</option>
                        <option value="현금">현금</option>
                      </optgroup>
                    </select>
                  ) : (
                    <input
                      className="f-input"
                      type="text"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                      placeholder="예: 계좌이체, 카드명"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="f-modal-actions">
              <button type="button" onClick={() => setShowAddForm(false)} className="f-btn-secondary">
                취소
              </button>
              <button
                type="button"
                onClick={handleAddTransfer}
                disabled={!canSubmit}
                className="f-btn-primary"
              >
                등록 완료
              </button>
            </div>
          </div>
        </div>,
        portalRoot()
      )}
    </div>
  );
}
