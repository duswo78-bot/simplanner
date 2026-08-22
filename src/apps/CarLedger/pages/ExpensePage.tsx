import React, { useState } from 'react';
import { useCarLedgerStore } from '../CarLedgerStore';
import type { ExpenseCategory } from '../CarLedgerStore';
import { Trash2, AlertCircle, Receipt } from 'lucide-react';
import { pushToAccountBook } from '../../shared/EventBus';

interface ExpensePageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

const CATEGORIES: ExpenseCategory[] = ['주유', '톨비', '주차', '정비', '보험', '자동차세', '세차', '기타'];

export const ExpensePage: React.FC<ExpensePageProps> = ({ store }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState(store.vehicles[0]?.id || '');
  const [category, setCategory] = useState<ExpenseCategory>('주유');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const [syncToAccountBook, setSyncToAccountBook] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;

    store.addExpense({
      vehicleId,
      date,
      category,
      amount: Number(amount) || 0,
      memo,
    });

    if (syncToAccountBook && Number(amount) > 0) {
      pushToAccountBook({
        type: 'expense',
        amount: Number(amount),
        category: '차량',
        date,
        memo: `[${category}] ${memo}`,
      });
    }

    setAmount('');
    setMemo('');
    setSyncToAccountBook(false);
  };

  if (store.vehicles.length === 0) {
    return (
      <div className="cl-page">
        <div className="cl-empty">
          <AlertCircle size={48} />
          <p>등록된 차량이 없습니다.<br/>먼저 차량을 등록해주세요.</p>
        </div>
      </div>
    );
  }

  const stats = store.getMonthlyStats();

  return (
    <div className="cl-page">
      <div className="cl-stats-summary-card cl-mb-16">
        <div className="cl-stats-summary-label">이번 달 총 지출</div>
        <div className="cl-stats-summary-value">{stats.totalExpenses.toLocaleString()}원</div>
      </div>

      <form className="cl-form cl-mb-16" onSubmit={handleSubmit}>
        <div className="cl-form-group">
          <label className="cl-form-label">차량 선택</label>
          <select 
            className="cl-vehicle-select" 
            value={vehicleId} 
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {store.vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
            ))}
          </select>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">지출 항목</label>
          <div className="cl-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`cl-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="cl-form-row">
          <div className="cl-form-group">
            <label className="cl-form-label">날짜</label>
            <input 
              type="date" 
              className="cl-form-input" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="cl-form-group">
            <label className="cl-form-label">금액 (원)</label>
            <input 
              type="number" 
              className="cl-form-input" 
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">메모</label>
          <input 
            type="text" 
            className="cl-form-input" 
            placeholder="상세 내역 입력"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
          <input 
            type="checkbox" 
            id="syncAccountBookExp" 
            checked={syncToAccountBook} 
            onChange={(e) => setSyncToAccountBook(e.target.checked)} 
          />
          <label htmlFor="syncAccountBookExp" style={{ fontSize: '0.9rem', color: '#475569' }}>가계부 지출로 자동 기록하기</label>
        </div>

        <button type="submit" className="cl-submit-btn">저장하기</button>
      </form>

      <h2 className="cl-section-title">최근 지출 내역</h2>
      <div className="cl-record-list">
        {store.expenses.length === 0 ? (
          <div className="cl-empty" style={{ padding: '20px 0' }}>
            <p>지출 내역이 없습니다.</p>
          </div>
        ) : (
          store.expenses.map(record => {
            const vehicle = store.vehicles.find(v => v.id === record.vehicleId);
            return (
              <div key={record.id} className="cl-record-item">
                <div className="cl-record-left">
                  <div className="cl-record-icon" style={{ background: '#7c3aed' }}>
                    <Receipt size={20} />
                  </div>
                  <div className="cl-record-info">
                    <span className="cl-record-title">{record.category}</span>
                    <span className="cl-record-sub">{record.date} • {vehicle?.name || '알 수 없음'}</span>
                  </div>
                </div>
                <div className="cl-record-right">
                  <span className="cl-record-value">{record.amount.toLocaleString()}원</span>
                  <button className="cl-delete-btn" onClick={() => store.deleteExpense(record.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
