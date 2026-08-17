import React from 'react';
import { CalendarDays, Wallet, Home, Phone, Shield, MonitorPlay, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface TransferPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function TransferPage({ store }: TransferPageProps) {
  // Sort auto-transfers by payment date
  const sortedTransfers = [...store.autoTransfers].sort((a, b) => a.paymentDate - b.paymentDate);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '주거/공과금': return <Home size={18} color="#f59e0b" />;
      case '통신': return <Phone size={18} color="#3b82f6" />;
      case '보험': return <Shield size={18} color="#10b981" />;
      case '구독': return <MonitorPlay size={18} color="#ec4899" />;
      default: return <Wallet size={18} color="#94a3b8" />;
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

  return (
    <div className="finance-transfer-page animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Header Summary */}
      <div className="f-card" style={{ marginBottom: '20px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', position: 'relative', overflow: 'hidden' }}>
        <CalendarDays size={120} color="rgba(59, 130, 246, 0.05)" style={{ position: 'absolute', right: '-20px', bottom: '-20px' }} />
        
        <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '8px', position: 'relative', zIndex: 1 }}>
          이번 달 자동이체 예정 총액
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f8fafc', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
          {totalMonthlyAuto.toLocaleString()}원
        </div>
        
        <div style={{ display: 'flex', gap: '8px', position: 'relative', zIndex: 1 }}>
          <div style={{ background: '#334155', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', color: '#cbd5e1' }}>
            총 {sortedTransfers.length}건 대기중
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', color: '#34d399' }}>
            잔고 충분
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 4px', color: '#e2e8f0' }}>자동이체 타임라인</h3>

      {/* Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedTransfers.map((item, index) => {
          // Calculate if it's past or future (mocking logic assuming today is 1st for demo)
          const isUpcoming = true; 

          return (
            <div key={item.id} className="f-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              
              {/* Date Box */}
              <div style={{ 
                minWidth: '50px', 
                height: '56px', 
                borderRadius: '12px', 
                background: '#0f172a',
                border: '1px solid #334155',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: isUpcoming ? '#3b82f6' : '#64748b'
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>매월</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.paymentDate}</span>
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
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
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
                  {item.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wallet size={12} /> {item.paymentMethod}
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  {item.amount.toLocaleString()}원
                </div>
              </div>
              
              {/* Arrow */}
              <ChevronRight size={18} color="#475569" />
            </div>
          );
        })}
      </div>

      {/* Add Button */}
      <button 
        className="f-btn-secondary" 
        style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
      >
        <span>+ 새로운 자동이체 등록</span>
      </button>

    </div>
  );
}
