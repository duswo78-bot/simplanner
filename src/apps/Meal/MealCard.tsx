import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp, Flame, RefreshCw } from 'lucide-react';

interface MealData {
  items: string[];
  calories: string;
  origin: string;
  nutrition: string;
  population?: string;
}

interface MealCardProps {
  date: Date;
  meal: MealData | null;
  loading: boolean;
  error: string | null;
}

export function MealCard({ date, meal, loading, error }: MealCardProps) {
  const [activeTab, setActiveTab] = useState<'origin' | 'nutrition' | null>(null);

  // Close accordion when date changes
  useEffect(() => {
    setActiveTab(null);
  }, [date]);
  
  // Compute a deterministic "random" background based on the date
  const bgImageId = useMemo(() => {
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return (seed % 5) + 1;
  }, [date]);
  
  const bgUrl = `${import.meta.env.BASE_URL}images/bg${bgImageId}.jpg`;

  if (loading) {
    return (
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
        <RefreshCw className="animate-spin mx-auto mb-4" size={32} color="#f43f5e" />
        <p style={{ color: 'var(--text-muted)' }}>식단을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="glass-panel" style={{ padding: '60px 20px', borderRadius: '16px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>이 날은 급식 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div 
      className="glass-panel" 
      style={{ 
        borderRadius: '16px', 
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.4)', // Base card color
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Top Section: Meal Info WITH Background Image */}
      <div style={{ position: 'relative', padding: '20px' }}>
        {/* Background Image Layer */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url('${bgUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.3,
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Calories and Population */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb923c' }}>
            <Flame size={20} />
            <span>{meal.calories}</span>
          </div>
          {meal.population && (
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
              급식인원 {Number(meal.population).toLocaleString()}명
            </div>
          )}
        </div>
          <ul style={{ listStyle: 'none', gap: '14px', display: 'flex', flexDirection: 'column', fontSize: '1.05rem', padding: 0, margin: 0 }}>
            {meal.items.map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e', flexShrink: 0 }}></div>
                <span style={{ color: '#fff', lineHeight: '1.4' }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Section: Accordions WITHOUT Background Image */}
      <div style={{ 
        background: 'rgba(0,0,0,0.3)', 
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Origin Accordion */}
        <div>
          <button 
            onClick={() => setActiveTab(activeTab === 'origin' ? null : 'origin')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: '0.9rem', cursor: 'pointer', padding: 0
            }}
          >
            <span>원산지 정보 보기</span>
            {activeTab === 'origin' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {activeTab === 'origin' && (
            <div style={{ 
              marginTop: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', 
              lineHeight: '1.6'
            }} dangerouslySetInnerHTML={{ __html: meal.origin }} />
          )}
        </div>

        {/* Nutrition Accordion */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <button 
            onClick={() => setActiveTab(activeTab === 'nutrition' ? null : 'nutrition')}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)',
              fontSize: '0.9rem', cursor: 'pointer', padding: 0
            }}
          >
            <span>세부 영양성분 정보 보기</span>
            {activeTab === 'nutrition' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          
          {activeTab === 'nutrition' && (
            <div style={{ 
              marginTop: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', 
              lineHeight: '1.6'
            }} dangerouslySetInnerHTML={{ __html: meal.nutrition || '' }} />
          )}
        </div>
      </div>
    </div>
  );
}
