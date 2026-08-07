import React, { useState, useEffect } from 'react';
import { AppContainer } from '../components/AppContainer';
import { Save, Share2, Trash2 } from 'lucide-react';

interface CalculatorAppProps {
  onBack: () => void;
}

interface SavedCalc {
  id: number;
  name: string;
  equation: string;
  result: string;
}

export function CalculatorApp({ onBack }: CalculatorAppProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  // For saving history
  const [lastCalc, setLastCalc] = useState<{ eq: string; res: string } | null>(null);
  const [savedList, setSavedList] = useState<SavedCalc[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('calculator_saved');
    if (saved) {
      try {
        setSavedList(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calculator_saved', JSON.stringify(savedList));
  }, [savedList]);

  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDot = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return a / b;
      default: return b;
    }
  };

  const handleOp = (op: string) => {
    const currentValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(display);
      setEquation(display + ' ' + op);
    } else if (operator) {
      const result = calculate(parseFloat(prevValue), currentValue, operator);
      setDisplay(String(result));
      setPrevValue(String(result));
      setEquation(String(result) + ' ' + op);
    }

    setOperator(op);
    setWaitingForNewValue(true);
  };

  const handleEqual = () => {
    if (operator && prevValue !== null) {
      const currentValue = parseFloat(display);
      const result = calculate(parseFloat(prevValue), currentValue, operator);
      
      const fullEq = `${prevValue} ${operator} ${currentValue}`;
      const resStr = String(result);
      
      setDisplay(resStr);
      setEquation('');
      setPrevValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
      
      setLastCalc({ eq: fullEq, res: resStr });
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setPrevValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const handleDelete = () => {
    if (waitingForNewValue) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handlePlusMinus = () => {
    setDisplay(String(parseFloat(display) * -1));
  };

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  const handleSave = () => {
    if (!lastCalc) {
      alert('저장할 계산 결과가 없습니다. 먼저 계산을 완료( = )해 주세요.');
      return;
    }
    if (savedList.length >= 5) {
      alert('최대 5개까지만 저장할 수 있습니다. 기존 항목을 삭제해 주세요.');
      return;
    }
    const name = window.prompt('어떤 계산인가요? (예: 더치페이, 장보기 등)');
    if (name === null) return;
    
    setSavedList([...savedList, {
      id: Date.now(),
      name: name || '이름 없음',
      equation: lastCalc.eq,
      result: lastCalc.res
    }]);
  };

  const handleShare = async (calc: SavedCalc) => {
    const shareData = {
      title: calc.name,
      text: `[${calc.name}]\n계산 과정: ${calc.equation}\n결과: ${calc.result}`
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.\n\n' + shareData.text);
      }
    } catch (err) {
      console.error('공유 실패:', err);
    }
  };

  const handleDeleteSaved = (id: number) => {
    setSavedList(savedList.filter(item => item.id !== id));
  };

  const buttonStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'background 0.1s',
  };

  const opStyle = {
    ...buttonStyle,
    background: 'rgba(245, 158, 11, 0.8)',
    color: '#fff',
  };

  const topOpStyle = {
    ...buttonStyle,
    background: 'rgba(255,255,255,0.2)',
    color: '#e2e8f0',
  };

  return (
    <AppContainer title="계산기" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: '12px' }}>
        
        {/* Display */}
        <div style={{ 
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end',
          padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', minHeight: '80px'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', minHeight: '1.2rem', marginBottom: '4px' }}>
            {equation}
          </div>
          <div style={{ color: '#fff', fontSize: display.length > 10 ? '2rem' : '3rem', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'right', lineHeight: 1 }}>
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', 
          gap: '8px', minHeight: '280px'
        }}>
          <button style={topOpStyle} onClick={handleClear}>C</button>
          <button style={topOpStyle} onClick={handlePlusMinus}>+/-</button>
          <button style={topOpStyle} onClick={handlePercent}>%</button>
          <button style={opStyle} onClick={() => handleOp('÷')}>÷</button>
          
          <button style={buttonStyle} onClick={() => handleNum('7')}>7</button>
          <button style={buttonStyle} onClick={() => handleNum('8')}>8</button>
          <button style={buttonStyle} onClick={() => handleNum('9')}>9</button>
          <button style={opStyle} onClick={() => handleOp('×')}>×</button>
          
          <button style={buttonStyle} onClick={() => handleNum('4')}>4</button>
          <button style={buttonStyle} onClick={() => handleNum('5')}>5</button>
          <button style={buttonStyle} onClick={() => handleNum('6')}>6</button>
          <button style={opStyle} onClick={() => handleOp('-')}>-</button>
          
          <button style={buttonStyle} onClick={() => handleNum('1')}>1</button>
          <button style={buttonStyle} onClick={() => handleNum('2')}>2</button>
          <button style={buttonStyle} onClick={() => handleNum('3')}>3</button>
          <button style={opStyle} onClick={() => handleOp('+')}>+</button>
          
          <button style={{ ...buttonStyle, gridColumn: 'span 2' }} onClick={() => handleNum('0')}>0</button>
          <button style={buttonStyle} onClick={handleDot}>.</button>
          <button style={opStyle} onClick={handleEqual}>=</button>
        </div>
        
        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>저장된 계산 (최대 5개)</h3>
          <button 
            onClick={handleSave}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: 'var(--accent-gradient)', color: '#fff', 
              border: 'none', borderRadius: '12px', padding: '8px 16px', 
              fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' 
            }}>
            <Save size={16} /> 저장하기
          </button>
        </div>

        {/* Saved List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '20px' }}>
          {savedList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.9rem' }}>
              = 버튼을 눌러 계산을 완료한 후,<br/>저장하기 버튼을 눌러보세요!
            </div>
          ) : (
            savedList.map((calc) => (
              <div key={calc.id} style={{ 
                background: 'var(--card-bg)', borderRadius: '12px', padding: '12px', 
                border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{calc.name}</strong>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleShare(calc)}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', padding: '4px', cursor: 'pointer' }}>
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSaved(calc.id)}
                      style={{ background: 'none', border: 'none', color: '#f43f5e', padding: '4px', cursor: 'pointer' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{calc.equation}</span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>{calc.result}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppContainer>
  );
}
