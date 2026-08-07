import React, { useState, useEffect } from 'react';
import { AppContainer } from '../components/AppContainer';
import './CalculatorApp.css';
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
  const [expression, setExpression] = useState('');
  const [justEvaluated, setJustEvaluated] = useState(false);

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

  const evaluate = (expr: string) => {
    let formattedExpr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '/100');
    try {
      // eslint-disable-next-line no-new-func
      const res = new Function('return ' + formattedExpr)();
      if (res === Infinity || Number.isNaN(res) || typeof res !== 'number') return 'Error';
      return String(Math.round(res * 100000000) / 100000000);
    } catch (e) {
      return 'Error';
    }
  };

  const handleInput = (val: string) => {
    if (justEvaluated) {
      if (['+', '-', '×', '÷'].includes(val)) {
        setExpression(expression + val);
      } else {
        setExpression(val);
      }
      setJustEvaluated(false);
      return;
    }
    setExpression(prev => (prev === 'Error' ? val : prev + val));
  };

  const handleEqual = () => {
    if (!expression || expression === 'Error') return;
    const res = evaluate(expression);
    if (res !== 'Error') {
      setLastCalc({ eq: expression, res });
      setExpression(res);
      setJustEvaluated(true);
    } else {
      setExpression('Error');
      setJustEvaluated(true);
    }
  };

  const handleClear = () => {
    setExpression('');
    setJustEvaluated(false);
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



  return (
    <AppContainer title="계산기" onBack={onBack}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px', gap: '16px' }}>
        
        <div className="calc-chassis">
          {/* Display */}
          <div className="calc-display">
            <div style={{ color: '#fff', fontSize: expression.length > 15 ? '1.5rem' : '2.5rem', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'right', lineHeight: 1.2, position: 'relative', zIndex: 1 }}>
              {expression || '0'}
            </div>
          </div>

          {/* Keypad */}
          <div className="calc-keypad">
            <button className="calc-btn op-top" onClick={handleClear}>C</button>
            <button className="calc-btn op-top" onClick={() => handleInput('(')}>(</button>
            <button className="calc-btn op-top" onClick={() => handleInput(')')}>)</button>
            <button className="calc-btn op-right" onClick={() => handleInput('÷')}>÷</button>
            
            <button className="calc-btn" onClick={() => handleInput('7')}>7</button>
            <button className="calc-btn" onClick={() => handleInput('8')}>8</button>
            <button className="calc-btn" onClick={() => handleInput('9')}>9</button>
            <button className="calc-btn op-right" onClick={() => handleInput('×')}>×</button>
            
            <button className="calc-btn" onClick={() => handleInput('4')}>4</button>
            <button className="calc-btn" onClick={() => handleInput('5')}>5</button>
            <button className="calc-btn" onClick={() => handleInput('6')}>6</button>
            <button className="calc-btn op-right" onClick={() => handleInput('-')}>-</button>
            
            <button className="calc-btn" onClick={() => handleInput('1')}>1</button>
            <button className="calc-btn" onClick={() => handleInput('2')}>2</button>
            <button className="calc-btn" onClick={() => handleInput('3')}>3</button>
            <button className="calc-btn op-right" onClick={() => handleInput('+')}>+</button>
            
            <button className="calc-btn" onClick={() => handleInput('0')}>0</button>
            <button className="calc-btn" onClick={() => handleInput('.')}>.</button>
            <button className="calc-btn" onClick={() => handleInput('%')}>%</button>
            <button className="calc-btn op-right" onClick={handleEqual}>=</button>
          </div>
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
