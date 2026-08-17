import React, { useState } from 'react';
import { Plus, Camera, Search, CheckCircle2, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useFinanceStore, CARD_CATALOG } from '../FinanceStore';
import type { Card } from '../FinanceStore';

interface CardPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function CardPage({ store }: CardPageProps) {
  const [showRegister, setShowRegister] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [matchedCards, setMatchedCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const handleSimulateOCR = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setSearchQuery('롯데카드');
      const matches = CARD_CATALOG.filter(c => c.name.includes('롯데') || c.company.includes('롯데'));
      setMatchedCards(matches);
    }, 1500);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedCard(null);
    
    if (query.length >= 2) {
      const matches = CARD_CATALOG.filter(c => c.name.includes(query) || c.company.includes(query));
      setMatchedCards(matches);
    } else {
      setMatchedCards([]);
    }
  };

  const handleRegisterCard = () => {
    if (!selectedCard) return;
    
    // Add real data from catalog, initializing dynamic user fields
    store.addCard({
      company: selectedCard.company,
      name: selectedCard.name,
      annualFee: selectedCard.annualFee,
      targetPerformance: selectedCard.targetPerformance,
      currentPerformance: 0,
      benefits: selectedCard.benefits,
      image: selectedCard.image,
      paymentDate: 14,
      expectedPayment: 0
    });
    
    setShowRegister(false);
    setSearchQuery('');
    setMatchedCards([]);
    setSelectedCard(null);
  };

  return (
    <div className="finance-card-page animate-fade-in" style={{ paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 4px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>보유 카드 <span style={{ color: '#3b82f6' }}>{store.cards.length}</span></h2>
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
                    <div style={{ width: '60px', height: '95px', background: '#334155', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={24} color="#64748b" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{card.company}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{card.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <button onClick={() => store.removeCard(card.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>결제일 매월 {card.paymentDate}일</div>
                </div>
              </div>

              {/* Performance Bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#e2e8f0' }}>실적 달성 현황</span>
                  <span style={{ color: isAchieved ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                    {isAchieved ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle2 size={14} /> 달성 완료</span>
                    ) : (
                      `${remaining.toLocaleString()}원 남음`
                    )}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${perfRatio}%`, height: '100%', background: isAchieved ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.75rem', color: '#64748b' }}>
                  <span>현재 {card.currentPerformance.toLocaleString()}원</span>
                  <span>목표 {card.targetPerformance.toLocaleString()}원</span>
                </div>
              </div>

              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>주요 혜택</div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
      {showRegister && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: '#0f172a', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', padding: '24px', animation: 'fadeIn 0.3s ease' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.2rem' }}>새 카드 등록</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
              실제 카드명을 검색하거나 카메라 아이콘을 눌러 카드를 스캔하세요. (예: 롯데카드, 삼성 taptap)
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748b' }} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="예: 롯데카드" 
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px 10px 10px 36px', color: '#f8fafc', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <button 
                onClick={handleSimulateOCR}
                disabled={scanning}
                style={{ background: '#334155', border: 'none', borderRadius: '12px', width: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', cursor: 'pointer' }}
              >
                {scanning ? <div className="spinner" style={{ width: '16px', height: '16px', border: '2px solid #64748b', borderTopColor: '#f8fafc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Camera size={20} />}
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {matchedCards.length > 0 ? matchedCards.map((c, i) => (
                <div 
                  key={i}
                  onClick={() => setSelectedCard(c)}
                  style={{ 
                    background: selectedCard?.name === c.name ? 'rgba(59, 130, 246, 0.1)' : '#1e293b', 
                    border: selectedCard?.name === c.name ? '1px solid #3b82f6' : '1px solid transparent', 
                    borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {c.image && (
                    <img src={c.image} alt={c.name} style={{ width: '30px', height: '47px', objectFit: 'contain' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{c.company}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginTop: '2px' }}>{c.name}</div>
                  </div>
                  {selectedCard?.name === c.name && <CheckCircle2 size={20} color="#3b82f6" />}
                </div>
              )) : (
                searchQuery.length >= 2 && <div style={{ color: '#64748b', textAlign: 'center', padding: '20px 0' }}>검색 결과가 없습니다.</div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button onClick={() => { setShowRegister(false); setMatchedCards([]); setSearchQuery(''); setSelectedCard(null); }} className="f-btn-secondary">취소</button>
              <button onClick={handleRegisterCard} disabled={!selectedCard} className="f-btn-primary" style={{ opacity: selectedCard ? 1 : 0.5 }}>등록하기</button>
            </div>
          </div>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          `}</style>
        </div>
      )}
    </div>
  );
}
