import React from 'react';
import { CreditCard, RefreshCw, Calendar, Sparkles, ChevronRight, Share2, Bell } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface HomePageProps {
  store: ReturnType<typeof useFinanceStore>;
  onNavigate: (page: string) => void;
}

export function HomePage({ store, onNavigate }: HomePageProps) {
  const currentMonth = new Date().getMonth() + 1;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: '내 카드 비서',
          text: '이번 달 나의 금융 캘린더와 자동이체 일정을 확인해보세요!',
          url: window.location.href,
        });
      } else {
        alert('공유 링크가 클립보드에 복사되었습니다.');
      }
    } catch (e) {
      console.log('공유 취소됨');
    }
  };

  return (
    <div className="finance-home-page animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--f-text-primary)' }}>{currentMonth}월의 리포트</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Share2 size={22} color="var(--f-text-muted)" cursor="pointer" onClick={handleShare} />
          <div style={{ position: 'relative' }}>
            <Bell size={22} color="var(--f-text-muted)" cursor="pointer" />
            <div style={{ position: 'absolute', top: -2, right: -2, width: '8px', height: '8px', background: '#f87171', borderRadius: '50%' }} />
          </div>
        </div>
      </div>

      {/* KPI Section */}
      <div className="f-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--f-text-muted)', marginBottom: '4px' }}>이번 달 결제 예정액</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--f-text-primary)' }}>
              {store.totalExpectedPayment.toLocaleString()}원
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--f-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--f-text-tertiary)', marginBottom: '2px' }}>월말 예상 잔액</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#34d399' }}>
              {store.expectedMonthlyBalance.toLocaleString()}원
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--f-text-tertiary)', marginBottom: '2px' }}>예상 절약 금액</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#3b82f6' }}>
              42,500원
            </div>
          </div>
        </div>
      </div>

      {/* Quick Menu */}
      <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 4px', color: 'var(--f-text-secondary)' }}>빠른 메뉴</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
        {[
          { icon: <CreditCard size={20}/>, label: '내 카드', path: 'cards' },
          { icon: <RefreshCw size={20}/>, label: '자동이체', path: 'transfer' },
          { icon: <Calendar size={20}/>, label: '소비분석', path: 'analysis' },
          { icon: <Sparkles size={20}/>, label: '혜택검색', path: 'analysis' },
        ].map(menu => (
          <button 
            key={menu.label} 
            onClick={() => onNavigate(menu.path)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', 
              background: 'var(--f-bg-elevated)', border: 'none', borderRadius: '16px', padding: '16px 0',
              cursor: 'pointer', transition: 'background 0.2s'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--f-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--f-text-primary)' }}>
              {menu.icon}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--f-text-secondary)' }}>{menu.label}</span>
          </button>
        ))}
      </div>

      {/* AI Insights Widget */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 16px 4px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--f-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={18} color="#8b5cf6" /> AI 카드 비서
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {store.aiInsights.map((insight: any) => (
          <div key={insight.id} className="f-card" style={{ padding: '16px', borderLeft: insight.isUrgent ? '4px solid #f87171' : '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: insight.isUrgent ? '#fca5a5' : '#93c5fd', marginBottom: '6px' }}>
                  {insight.title}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--f-text-primary)', lineHeight: 1.4 }}>
                  {insight.message}
                </div>
              </div>
              <ChevronRight size={18} color="var(--f-text-muted)" style={{ marginTop: '2px' }} />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
