import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, CheckCircle2, Image as ImageIcon, Trash2, CreditCard } from 'lucide-react';
import { useFinanceStore, CARD_CATALOG } from '../FinanceStore';
import type { Card } from '../FinanceStore';

interface CardPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function CardPage({ store }: CardPageProps) {
  const [showRegister, setShowRegister] = useState(false);
  
  // 새 등록 플로우 상태
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // 고유 카드사 목록
  const COMPANIES = Array.from(new Set(CARD_CATALOG.map(c => c.company)));

  // 조건에 따른 카드 필터링
  const searchResults = CARD_CATALOG.filter(c => {
    if (selectedCompany && c.company !== selectedCompany) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const selectCard = (card: Card) => {
    setSelectedCard(card);
  };

  const registerSelectedCard = () => {
    if (!selectedCard) return;
    
    store.addCard({
      company: selectedCard.company,
      name: selectedCard.name,
      annualFee: selectedCard.annualFee,
      targetPerformance: selectedCard.targetPerformance || 300000,
      currentPerformance: 0,
      benefits: selectedCard.benefits,
      image: selectedCard.image,
      paymentDate: 14,
      expectedPayment: 0
    });
    
    setShowRegister(false);
    setSelectedCard(null);
    setSelectedCompany('');
    setSearchQuery('');
  };

  return (
    <div className="finance-card-page animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--f-text-primary)' }}>보유 카드 <span style={{ color: '#3b82f6' }}>{store.cards.length}</span></h2>
        <button 
          onClick={() => setShowRegister(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          <Plus size={18} /> 추가
        </button>
      </div>

      {/* Card List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {store.cards.map((card) => {
          const isAchieved = card.currentPerformance >= card.targetPerformance;
          const perfRatio = Math.min((card.currentPerformance / card.targetPerformance) * 100, 100);
          const remaining = card.targetPerformance - card.currentPerformance;
          
          return (
            <div key={card.id} className="f-card" style={{ padding: '20px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {card.image ? (
                    <img src={card.image} alt={card.name} style={{ width: '60px', height: '95px', objectFit: 'contain', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '60px', height: '95px', background: 'var(--f-bg-subtle)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="var(--f-text-tertiary)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--f-text-muted)' }}>{card.company}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--f-text-primary)', marginTop: '2px' }}>{card.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button onClick={() => store.removeCard(card.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                  <div style={{ fontSize: '0.8rem', color: 'var(--f-text-muted)' }}>결제일 매월 {card.paymentDate}일</div>
                </div>
              </div>

              {/* Performance Bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--f-text-secondary)' }}>실적 달성 현황</span>
                  <span style={{ color: isAchieved ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {isAchieved ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> 달성 완료</span>
                    ) : (
                      `${remaining.toLocaleString()}원 남음`
                    )}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--f-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${perfRatio}%`, height: '100%', background: isAchieved ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: 'var(--f-text-tertiary)' }}>
                  <span>현재 {card.currentPerformance.toLocaleString()}원</span>
                  <span>목표 {card.targetPerformance.toLocaleString()}원</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--f-bg-elevated)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--f-text-tertiary)', marginBottom: '8px' }}>주요 혜택</div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--f-text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {card.benefits.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Register Modal */}
      {showRegister && createPortal(
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--f-bg-main)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--f-text-primary)', fontSize: '1.2rem' }}>새 카드 등록</h3>
            <p style={{ color: 'var(--f-text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              카드사를 선택하고 카드명을 검색하여 등록할 카드를 선택해주세요.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                style={{ flex: 1, background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '10px 12px', color: 'var(--f-text-primary)', fontSize: '0.95rem', outline: 'none' }}
              >
                <option value="">모든 카드사</option>
                {COMPANIES.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: 'var(--f-text-tertiary)' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="카드명 검색 (예: 톡톡)" 
                  style={{ width: '100%', background: 'var(--f-bg-elevated)', border: '1px solid var(--f-bg-subtle)', borderRadius: '12px', padding: '10px 10px 10px 36px', color: 'var(--f-text-primary)', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', borderTop: '1px solid var(--f-bg-elevated)', paddingTop: '16px' }}>
              {searchResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--f-text-tertiary)', marginBottom: '4px' }}>검색 결과 {searchResults.length}건</div>
                  {searchResults.map((card, i) => (
                    <div 
                      key={i}
                      onClick={() => selectCard(card)}
                      style={{ 
                        display: 'flex', gap: '12px', padding: '12px', borderRadius: '12px', cursor: 'pointer',
                        background: selectedCard?.name === card.name ? 'rgba(59, 130, 246, 0.1)' : 'var(--f-bg-elevated)',
                        border: `1px solid ${selectedCard?.name === card.name ? '#3b82f6' : 'var(--f-bg-subtle)'}`
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', background: 'var(--f-bg-main)', borderRadius: '8px', padding: '4px' }}>
                        <img src={card.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--f-text-muted)' }}>{card.company}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--f-text-primary)', fontWeight: 600 }}>{card.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--f-text-tertiary)', fontSize: '0.9rem', marginTop: '20px' }}>
                  해당하는 카드가 없습니다.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button 
                onClick={() => { setShowRegister(false); setSelectedCard(null); setSelectedCompany(''); setSearchQuery(''); }} 
                className="f-btn-secondary"
              >
                취소
              </button>
              <button onClick={registerSelectedCard} disabled={!selectedCard} className="f-btn-primary" style={{ opacity: selectedCard ? 1 : 0.5 }}>
                선택한 카드 등록하기
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
