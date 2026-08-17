import React, { useState } from 'react';
import { Search, PieChart, Zap } from 'lucide-react';
import { useFinanceStore, CARD_CATALOG } from '../FinanceStore';

interface AnalysisPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function AnalysisPage({ store }: AnalysisPageProps) {
  const [activeTab, setActiveTab] = useState<'consumption' | 'benefits'>('consumption');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for consumption
  const categories = [
    { name: '식비', percent: 40, color: '#f87171', amount: 632800 },
    { name: '쇼핑', percent: 25, color: '#60a5fa', amount: 395500 },
    { name: '주유', percent: 15, color: '#fbbf24', amount: 237300 },
    { name: '통신', percent: 10, color: '#34d399', amount: 158200 },
    { name: '기타', percent: 10, color: '#94a3b8', amount: 158200 }
  ];

  const totalSpent = categories.reduce((sum, c) => sum + c.amount, 0);

  const getBestCardForSearch = () => {
    if (!searchQuery) return null;
    
    // 카탈로그에서 혜택에 키워드가 포함된 카드를 찾음
    const match = CARD_CATALOG.find(c => c.benefits.some(b => b.includes(searchQuery)));
    
    if (match) {
      const matchedBenefit = match.benefits.find(b => b.includes(searchQuery)) || match.benefits[0];
      return {
        name: match.name,
        benefit: matchedBenefit,
        expected: '최대 혜택 적용 가능'
      };
    }
    
    // 일치하는 카드가 없으면 랜덤 추천 흉내
    return {
      name: CARD_CATALOG[0].name,
      benefit: '기본 적립/할인 혜택 적용',
      expected: '포인트 적립 예상'
    };
  };

  return (
    <div className="finance-analysis-page" style={{ paddingBottom: '80px' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', background: '#1e293b', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('consumption')}
          style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', background: activeTab === 'consumption' ? '#334155' : 'transparent', color: activeTab === 'consumption' ? '#f8fafc' : '#94a3b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          소비 분석
        </button>
        <button 
          onClick={() => setActiveTab('benefits')}
          style={{ flex: 1, padding: '10px 0', borderRadius: '8px', border: 'none', background: activeTab === 'benefits' ? '#334155' : 'transparent', color: activeTab === 'benefits' ? '#f8fafc' : '#94a3b8', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          혜택 검색
        </button>
      </div>

      {/* Consumption Tab */}
      {activeTab === 'consumption' && (
        <div className="animate-fade-in">
          <div className="f-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PieChart size={18} color="#3b82f6" /> 8월 지출 분석
            </h3>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
              {totalSpent.toLocaleString()}원
            </div>
            <div style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: '20px' }}>
              지난달 동기 대비 8% 감소했어요!
            </div>

            {/* Custom Bar Chart */}
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
              {categories.map(c => (
                <div key={c.name} style={{ width: `${c.percent}%`, height: '100%', background: c.color }} />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categories.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.color }} />
                    <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{c.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.percent}%</span>
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 500, color: '#f8fafc' }}>
                    {c.amount.toLocaleString()}원
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3b82f6', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={14} /> AI 소비 패턴 분석
              </div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                현재 <strong>식비({categories[0].percent}%)</strong> 비중이 가장 높습니다. 식음료 할인이 강력한 <strong>삼성 taptap O</strong> 카드 사용을 늘리면 이번 달 약 <strong>32,000원</strong>을 추가 절약할 수 있어요!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Benefits Tab */}
      {activeTab === 'benefits' && (
        <div className="animate-fade-in">
          <div className="f-card" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 16px 0', color: '#e2e8f0' }}>어디서 결제하시나요?</h3>
            
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#64748b' }} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: 스타벅스, 배달의민족" 
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px 10px 10px 36px', color: '#f8fafc', fontSize: '1rem', outline: 'none' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              {['스타벅스', 'GS칼텍스', '배달의민족', '쿠팡', 'CGV'].map(tag => (
                <button 
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  style={{ whiteSpace: 'nowrap', background: '#334155', border: 'none', color: '#cbd5e1', padding: '6px 12px', borderRadius: '16px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {searchQuery && (
            <div className="f-card animate-fade-in" style={{ background: 'linear-gradient(145deg, #1e1b4b, #312e81)', border: '1px solid #4338ca' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                <Zap size={18} color="#a5b4fc" />
                <span style={{ fontSize: '0.9rem', color: '#a5b4fc', fontWeight: 600 }}>AI 최고 효율 카드 추천</span>
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '1rem', color: '#e0e7ff', marginBottom: '4px' }}>{searchQuery} 결제 시</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>{getBestCardForSearch()?.name}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>적용 혜택</span>
                  <span style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 500 }}>{getBestCardForSearch()?.benefit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.85rem', color: '#a5b4fc' }}>예상 혜택</span>
                  <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>{getBestCardForSearch()?.expected}</span>
                </div>
              </div>
              
              <button style={{ width: '100%', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '12px', padding: '12px', fontSize: '0.95rem', fontWeight: 600, marginTop: '16px', cursor: 'pointer' }}>
                이 카드로 삼성페이 결제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
