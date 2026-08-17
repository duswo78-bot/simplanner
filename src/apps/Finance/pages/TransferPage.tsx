import React from 'react';
import { createPortal } from 'react-dom';
import { useState } from 'react';
import { CalendarDays, Wallet, Home, Phone, Shield, MonitorPlay, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface TransferPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function TransferPage({ store }: TransferPageProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '주거/공과금',
    paymentDate: 1,
    amount: '',
    paymentMethod: store.cards.length > 0 ? store.cards[0].name : '계좌이체'
  });

  const sortedTransfers = [...store.autoTransfers].sort((a, b) => a.paymentDate - b.paymentDate);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '주거/공과금': return <Home size={18} color="#f59e0b" />;
      case '통신': return <Phone size={18} color="#3b82f6" />;
      case '보험': return <Shield size={18} color="#10b981" />;
      case '구독': return <MonitorPlay size={18} color="#ec4899" />;
      default: return <Wallet size={18} color="var(--f-text-muted)" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '주거/공과금': return '#fef3c7'; // amber-100
      case '통신': return '#dbeafe'; // blue-100
      case '보험': return '#d1fae5'; // emerald-100
      case '구독': return '#fce7f3'; // pink-100
      default: return '#f1f5f9';
    }
  };
  
  const getCategoryBg = (category: string) => {
    switch (category) {
      case '주거/공과금': return 'rgba(245, 158, 11, 0.15)'; 
      case '통신': return 'rgba(59, 130, 246, 0.15)';
      case '보험': return 'rgba(16, 185, 129, 0.15)'; 
      case '구독': return 'rgba(236, 72, 153, 0.15)';
      default: return 'rgba(148, 163, 184, 0.15)';
    }
  };

  const totalMonthlyAuto = sortedTransfers.reduce((sum, t) => sum + t.amount, 0);

  const handleAddTransfer = () => {
    if (!formData.name || !formData.amount) return;
    
    store.addAutoTransfer({
      name: formData.name,
      category: formData.category,
      paymentDate: Number(formData.paymentDate),
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod
    });
    
    setShowAddForm(false);
    setFormData({ ...formData, name: '', amount: '' });
  };

  return (
    <div className="finance-transfer-page animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Header Summary */}
      <div className="f-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, var(--f-bg-elevated), var(--f-bg-main))', position: 'relative', overflow: 'hidden' }}>
        <CalendarDays size={120} color="rgba(59, 130, 246, 0.05)" style={{ position: 'absolute', right: '-20px', bottom: '-20px' }} />
        
        <div style={{ fontSize: '0.9rem', color: 'var(--f-text-muted)', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          이번 달 자동이체 예정 총액
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--f-text-primary)', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          {totalMonthlyAuto.toLocaleString()}원
        </div>
        
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ background: 'var(--f-bg-subtle)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--f-text-tertiary)' }}>
            총 {sortedTransfers.length}건 대기중
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', color: '#34d399' }}>
            잔고 충분
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 4px', color: 'var(--f-text-secondary)' }}>자동이체 타임라인</h3>

      {/* Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedTransfers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--f-text-tertiary)', fontSize: '0.9rem' }}>
            등록된 자동이체 내역이 없습니다.
          </div>
        )}
        
        {sortedTransfers.map((item) => {
          const isUpcoming = true; 

          return (
            <div key={item.id} className="f-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Date Box */}
              <div style={{ 
                minWidth: '50px', 
                height: '56px', 
                borderRadius: '12px', 
                background: 'var(--f-bg-main)',
                border: '1px solid var(--f-bg-subtle)',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isUpcoming ? '#3b82f6' : 'var(--f-text-tertiary)'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>매월</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.paymentDate}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '4px', 
                    fontSize: '0.65rem', 
                    fontWeight: 600,
                    background: getCategoryBg(item.category),
                    color: getCategoryColor(item.category)
                  }}>
                    {item.category}
                  </span>
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--f-text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--f-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <Wallet size={12} /> {item.paymentMethod}
                </div>
              </div>

              {/* Amount & Delete */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <button 
                  onClick={() => store.removeAutoTransfer(item.id)} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--f-text-primary)' }}>
                  {item.amount.toLocaleString()}원
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <button 
        onClick={() => setShowAddForm(true)}
        className="f-btn-secondary" 
        style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
      >
        <Plus size={18} />
        <span>새로운 자동이체 등록</span>
      </button>

      {/* Register Modal */}
      {showAddForm && createPortal(
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: 'var(--f-bg-main)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--f-text-primary)', fontSize: '1.2rem' }}>자동이체 항목 추가</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '6px' }}>항목명</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="예: 넷플릭스, 관리비" 
                  style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '12px', color: 'var(--f-text-primary)', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '6px' }}>카테고리</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '12px', color: 'var(--f-text-primary)', fontSize: '1rem', outline: 'none' }}
                >
                  <option value="구독">구독 (OTT, 멤버십 등)</option>
                  <option value="주거/공과금">주거/공과금 (관리비, 가스 등)</option>
                  <option value="통신">통신비</option>
                  <option value="보험">보험료</option>
                  <option value="기타">기타 정기결제</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '6px' }}>결제 금액</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  placeholder="금액을 입력하세요 (숫자만)" 
                  style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '12px', color: 'var(--f-text-primary)', fontSize: '1rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '6px' }}>결제일 (매월)</label>
                  <select 
                    value={formData.paymentDate}
                    onChange={e => setFormData({...formData, paymentDate: Number(e.target.value)})}
                    style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '12px', color: 'var(--f-text-primary)', fontSize: '1rem', outline: 'none' }}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}일</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ flex: 2 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '6px' }}>결제 수단</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                    style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '12px', color: 'var(--f-text-primary)', fontSize: '1rem', outline: 'none' }}
                  >
                    <optgroup label="내 카드">
                      {store.cards.map(card => (
                        <option key={card.id} value={card.name}>{card.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="기타">
                      <option value="국민은행 생활비">국민은행 생활비 계좌</option>
                      <option value="신한은행 급여계좌">신한은행 급여계좌</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button onClick={() => setShowAddForm(false)} className="f-btn-secondary">취소</button>
              <button 
                onClick={handleAddTransfer} 
                disabled={!formData.name || !formData.amount} 
                className="f-btn-primary" 
                style={{ opacity: (!formData.name || !formData.amount) ? 0.5 : 1 }}
              >
                등록 완료
              </button>
            </div>
          </div>
          <style>{`
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>,
        document.querySelector('.finance-app') || document.body
      )}
    </div>
  );
}
