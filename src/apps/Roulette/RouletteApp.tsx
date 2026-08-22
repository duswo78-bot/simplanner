import React, { useState, useRef } from 'react';
import { AppContainer } from '../../components/AppContainer';
import { Play, Plus, Trash2 } from 'lucide-react';

interface RouletteAppProps {
  onBack: () => void;
}

const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
];

export function RouletteApp({ onBack }: RouletteAppProps) {
  const [items, setItems] = useState<string[]>(['짜장면', '짬뽕', '볶음밥', '탕수육']);
  const [newItem, setNewItem] = useState('');
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const addItem = () => {
    if (newItem.trim() && items.length < 10) {
      setItems([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const spin = () => {
    if (items.length < 2 || isSpinning) return;
    
    setIsSpinning(true);
    setSelectedItem(null);
    
    // Calculate new rotation
    const spins = 5; // number of full spins
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (spins * 360) + extraDegrees;
    
    setRotation(totalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      // Calculate which item won
      // The pointer is at the top (0 degrees).
      // When wheel rotates by totalRotation, the top points to (-totalRotation) % 360 on the wheel.
      // But we rotate the wheel clockwise. The slice angle is 360 / items.length.
      const sliceAngle = 360 / items.length;
      // Adjusting for the rotation
      const normalizedRotation = (360 - (totalRotation % 360)) % 360;
      const selectedIndex = Math.floor(normalizedRotation / sliceAngle);
      setSelectedItem(items[selectedIndex]);
    }, 3000); // match CSS transition time
  };

  const renderWheel = () => {
    if (items.length === 0) return null;
    
    let gradient = '';
    const sliceAngle = 360 / items.length;
    
    items.forEach((_, i) => {
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;
      gradient += `${COLORS[i % COLORS.length]} ${startAngle}deg ${endAngle}deg, `;
    });
    
    gradient = gradient.slice(0, -2); // remove last comma and space

    return (
      <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto' }}>
        {/* Pointer */}
        <div style={{
          position: 'absolute', top: '-15px', left: '50%', transform: 'translateX(-50%)',
          width: '0', height: '0', borderLeft: '15px solid transparent', borderRight: '15px solid transparent',
          borderTop: '25px solid #fff', zIndex: 10, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.3))'
        }} />
        
        {/* Wheel */}
        <div style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: `conic-gradient(${gradient})`,
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 3s cubic-bezier(0.2, 0.8, 0.1, 1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          border: '4px solid #fff',
          position: 'relative'
        }}>
          {items.map((item, i) => {
            const angle = (i * sliceAngle) + (sliceAngle / 2);
            return (
              <div key={i} style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '50%', height: '20px',
                transformOrigin: '0% 50%',
                transform: `translateY(-50%) rotate(${angle}deg)`,
                textAlign: 'right', paddingRight: '15px', boxSizing: 'border-box',
                color: '#fff', fontWeight: 'bold', fontSize: '14px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {item}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppContainer title="랜덤 룰렛" onBack={onBack}>
      <div style={{ padding: '20px', color: '#fff', height: '100%', overflowY: 'auto' }}>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '24px 16px', 
          marginBottom: '24px', textAlign: 'center' 
        }}>
          {renderWheel()}
          
          <div style={{ marginTop: '30px', minHeight: '40px' }}>
            {selectedItem ? (
              <div style={{ animation: 'pulse 1s infinite' }}>
                <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>당첨!</span>
                <br/>
                <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>{selectedItem}</span>
              </div>
            ) : isSpinning ? (
              <span style={{ fontSize: '1.2rem', color: '#fbbf24' }}>돌아가는 중...</span>
            ) : (
              <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>룰렛을 돌려보세요!</span>
            )}
          </div>
        </div>

        <button 
          onClick={spin}
          disabled={isSpinning || items.length < 2}
          style={{
            width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
            background: isSpinning || items.length < 2 ? '#475569' : 'linear-gradient(135deg, #f43f5e, #e11d48)',
            color: '#fff', fontSize: '1.2rem', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            cursor: isSpinning || items.length < 2 ? 'not-allowed' : 'pointer',
            marginBottom: '24px', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.4)'
          }}
        >
          <Play size={24} /> 룰렛 돌리기
        </button>

        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#e2e8f0' }}>항목 관리 (최대 10개)</h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="text" 
              placeholder="항목 입력" 
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              disabled={items.length >= 10 || isSpinning}
              style={{
                flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
                background: 'rgba(255,255,255,0.1)', color: '#fff'
              }}
            />
            <button 
              onClick={addItem}
              disabled={items.length >= 10 || isSpinning}
              style={{
                padding: '0 16px', borderRadius: '8px', border: 'none',
                background: items.length >= 10 || isSpinning ? '#475569' : '#3b82f6', color: '#fff',
                cursor: items.length >= 10 || isSpinning ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, index) => (
              <div key={index} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                  <span>{item}</span>
                </div>
                <button 
                  onClick={() => removeItem(index)}
                  disabled={isSpinning}
                  style={{ background: 'none', border: 'none', color: '#ef4444', padding: '4px', cursor: isSpinning ? 'not-allowed' : 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppContainer>
  );
}
