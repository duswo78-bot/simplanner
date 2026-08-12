import React, { useState, useRef, useMemo } from 'react';
import { ChevronLeft, Plus, Settings, Download, Upload, Trash2, Wallet, X, Utensils, Bus, ShoppingCart, Coffee, MoreHorizontal, Briefcase, MoreVertical, Share } from 'lucide-react';
import { useAccountStore } from './AccountStore';
import type { TransactionType, Transaction } from './AccountStore';
import './AccountBook.css';

interface AccountBookAppProps {
  onBack: () => void;
}

const CATEGORIES = {
  expense: [
    { id: 'food', label: '식비', icon: <Utensils size={20} /> },
    { id: 'transport', label: '교통', icon: <Bus size={20} /> },
    { id: 'shopping', label: '쇼핑', icon: <ShoppingCart size={20} /> },
    { id: 'cafe', label: '카페/간식', icon: <Coffee size={20} /> },
    { id: 'other_expense', label: '기타', icon: <MoreHorizontal size={20} /> },
  ],
  income: [
    { id: 'salary', label: '급여', icon: <Briefcase size={20} /> },
    { id: 'allowance', label: '용돈', icon: <Wallet size={20} /> },
    { id: 'other_income', label: '기타', icon: <MoreHorizontal size={20} /> },
  ]
};

const getCategoryIcon = (type: TransactionType, catId: string) => {
  const catList = CATEGORIES[type] || [];
  const cat = catList.find(c => c.id === catId);
  return cat ? cat.icon : <MoreHorizontal size={20} />;
};

const getCategoryLabel = (type: TransactionType, catId: string) => {
  const catList = CATEGORIES[type] || [];
  const cat = catList.find(c => c.id === catId);
  return cat ? cat.label : '기타';
};

export function AccountBookApp({ onBack }: AccountBookAppProps) {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showForm, setShowForm] = useState(false);
  
  const { transactions, addTransaction, deleteTransaction, clearData, exportData, importData, exportCSV, importCSV } = useAccountStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Stats calculation
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    // Simplistic current month filter for demo purposes
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM

    transactions.forEach(t => {
      if (t.date.startsWith(currentMonthPrefix)) {
        if (t.type === 'income') income += t.amount;
        else expense += t.amount;
      }
    });

    return { income, expense, balance: income - expense };
  }, [transactions]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvImportClick = () => {
    csvInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importData(file);
      if (success) {
        alert('데이터를 성공적으로 불러왔습니다.');
        setView('main');
      } else {
        alert('잘못된 파일 형식이거나 데이터를 불러오는데 실패했습니다.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCsvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const success = await importCSV(file);
      if (success) {
        alert('CSV 데이터를 성공적으로 불러왔습니다.');
        setView('main');
      } else {
        alert('잘못된 CSV 파일 형식이거나 데이터를 불러오는데 실패했습니다.');
      }
    }
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  return (
    <div className="account-app">
      <div className="account-header">
        <button className="icon-button" onClick={view === 'main' ? onBack : () => setView('main')}>
          <ChevronLeft size={24} />
        </button>
        <h1>{view === 'main' ? '가계부' : '데이터 관리'}</h1>
        {view === 'main' ? (
          <button className="icon-button" onClick={() => setView('settings')}>
            <MoreVertical size={22} />
          </button>
        ) : (
          <div style={{ width: 40 }} /> // Placeholder for balance
        )}
      </div>

      <div className="account-content">
        {view === 'main' && (
          <>
            <div className="dashboard-card">
              <div className="balance-label">이번 달 잔액</div>
              <div className="balance-amount">{formatMoney(stats.balance)}원</div>
              <div className="stats-row">
                <div className="stat-item">
                  <span className="stat-label">수입</span>
                  <span className="stat-value">+{formatMoney(stats.income)}원</span>
                </div>
                <div className="stat-item" style={{ alignItems: 'flex-end' }}>
                  <span className="stat-label">지출</span>
                  <span className="stat-value">-{formatMoney(stats.expense)}원</span>
                </div>
              </div>
            </div>

            <h2 className="section-title">최근 내역</h2>
            <div className="transaction-list">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <Wallet size={48} />
                  <p>아직 내역이 없습니다.<br/>새로운 수입/지출을 추가해보세요!</p>
                </div>
              ) : (
                transactions.slice(0, 50).map(t => (
                  <div key={t.id} className="transaction-item">
                    <div className="transaction-item-left">
                      <div className={`transaction-icon ${t.type}`}>
                        {getCategoryIcon(t.type, t.category)}
                      </div>
                      <div className="transaction-info">
                        <span className="transaction-category">{getCategoryLabel(t.type, t.category)}</span>
                        <span className="transaction-memo">{t.date} {t.memo ? `· ${t.memo}` : ''}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`transaction-amount ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}원
                      </span>
                      <button 
                        className="icon-button" 
                        style={{ padding: 4 }}
                        onClick={() => {
                          if (confirm('이 내역을 삭제하시겠습니까?')) {
                            deleteTransaction(t.id);
                          }
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="fab-button" onClick={() => setShowForm(true)}>
              <Plus size={28} />
            </button>
          </>
        )}

        {view === 'settings' && (
          <div className="settings-container">
            <div className="settings-group">
              <h4 className="settings-group-title">백업 및 복원</h4>
              <div className="settings-list">
                <button className="settings-item" onClick={exportCSV}>
                  <div className="settings-item-icon bg-indigo">
                    <Share size={20} />
                  </div>
                  <div className="settings-item-content">
                    <span className="settings-item-title">엑셀(CSV) 내보내기 / 공유</span>
                    <span className="settings-item-desc">현재 내역을 백업하거나 메일로 전송합니다.</span>
                  </div>
                </button>
                <button className="settings-item" onClick={handleCsvImportClick}>
                  <div className="settings-item-icon bg-emerald">
                    <Upload size={20} />
                  </div>
                  <div className="settings-item-content">
                    <span className="settings-item-title">엑셀(CSV) 불러오기</span>
                    <span className="settings-item-desc">기존에 백업한 데이터를 가져와 복원합니다.</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="settings-group">
              <h4 className="settings-group-title">위험 설정</h4>
              <div className="settings-list">
                <button className="settings-item danger" onClick={() => {
                  if (confirm('모든 가계부 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
                    clearData();
                    alert('삭제되었습니다.');
                  }
                }}>
                  <div className="settings-item-icon bg-rose">
                    <Trash2 size={20} />
                  </div>
                  <div className="settings-item-content">
                    <span className="settings-item-title">모든 데이터 초기화</span>
                    <span className="settings-item-desc">모든 기록을 삭제하고 초기 상태로 되돌립니다.</span>
                  </div>
                </button>
              </div>
            </div>
            
            <input 
              type="file" 
              accept=".csv" 
              ref={csvInputRef} 
              style={{ display: 'none' }} 
              onChange={handleCsvChange}
            />
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm 
          onClose={() => setShowForm(false)} 
          onSubmit={(data) => {
            addTransaction(data);
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}

function TransactionForm({ onClose, onSubmit }: { onClose: () => void, onSubmit: (data: Omit<Transaction, 'id'|'timestamp'>) => void }) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES['expense'][0].id);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }
    onSubmit({
      type,
      amount: Number(amount),
      category,
      date,
      memo
    });
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(CATEGORIES[newType][0].id);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>내역 추가</h2>
          <button className="icon-button" onClick={onClose}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="type-selector">
            <button 
              type="button" 
              className={`type-btn expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => handleTypeChange('expense')}
            >
              지출
            </button>
            <button 
              type="button" 
              className={`type-btn income ${type === 'income' ? 'active' : ''}`}
              onClick={() => handleTypeChange('income')}
            >
              수입
            </button>
          </div>

          <div className="form-group">
            <label>금액</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="0" 
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>분류</label>
            <select 
              className="form-control"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORIES[type].map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>날짜</label>
            <input 
              type="date" 
              className="form-control" 
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>메모 (선택)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="내용을 입력하세요" 
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <button type="submit" className="submit-btn">추가하기</button>
        </form>
      </div>
    </div>
  );
}
