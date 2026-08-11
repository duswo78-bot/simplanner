import React, { useState, useEffect } from 'react';
import { AppContainer } from '../components/AppContainer';
import './CalculatorApp.css';
import { Save, Share2, Trash2, Sigma, Calculator, Delete } from 'lucide-react';

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
  const [isEngineering, setIsEngineering] = useState(false);

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
    let formattedExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/√\(/g, 'Math.sqrt(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/π/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/\^/g, '**');

    let openCount = (formattedExpr.match(/\(/g) || []).length;
    let closeCount = (formattedExpr.match(/\)/g) || []).length;
    while (openCount > closeCount) {
      formattedExpr += ')';
      closeCount++;
    }

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

  const handleNegate = () => {
    if (justEvaluated && expression !== 'Error' && expression !== '') {
      setExpression(expression.startsWith('-') ? expression.substring(1) : '-' + expression);
      setJustEvaluated(false);
      return;
    }
    
    if (expression === 'Error' || expression === '') {
      setExpression('-');
      setJustEvaluated(false);
      return;
    }
    
    const negMatch = expression.match(/\(-\d+(\.\d+)?$/);
    if (negMatch) {
       const num = negMatch[0].substring(2);
       setExpression(expression.slice(0, -negMatch[0].length) + num);
       return;
    }
    
    const numMatch = expression.match(/\d+(\.\d+)?$/);
    if (numMatch) {
       setExpression(expression.slice(0, -numMatch[0].length) + '(-' + numMatch[0]);
       return;
    }
    
    if (expression.endsWith('(-')) {
       setExpression(expression.slice(0, -2));
       return;
    }
    
    setExpression(prev => prev + '(-');
  };

  const handleBackspace = () => {
    if (justEvaluated || expression === 'Error') {
      setExpression('');
      setJustEvaluated(false);
      return;
    }
    setExpression(prev => prev.slice(0, -1));
  };

  const handleParentheses = () => {
    if (expression === 'Error') {
      setExpression('(');
      setJustEvaluated(false);
      return;
    }
    
    if (justEvaluated || expression === '') {
      setExpression('(');
      setJustEvaluated(false);
      return;
    }

    const openCount = (expression.match(/\(/g) || []).length;
    const closeCount = (expression.match(/\)/g) || []).length;
    const lastChar = expression.slice(-1);
    const isNumberOrClose = /[0-9)%]/.test(lastChar);

    if (openCount > closeCount && isNumberOrClose) {
      setExpression(prev => prev + ')');
    } else {
      if (isNumberOrClose) {
        setExpression(prev => prev + '×(');
      } else {
        setExpression(prev => prev + '(');
      }
    }
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
    const dateObj = new Date(calc.id);
    const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    const shareData = {
      title: calc.name,
      text: `[${calc.name} (${dateStr})]\n계산 과정: ${calc.equation}\n결과: ${calc.result}`
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
    if (window.confirm('정말 이 계산 기록을 삭제하시겠습니까?')) {
      setSavedList(savedList.filter(item => item.id !== id));
    }
  };



  const formatExpression = (expr: string) => {
    return expr.replace(/\d+(?:\.\d+)?/g, (match) => {
      const parts = match.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    });
  };

  const headerAction = (
    <button 
      onClick={() => setIsEngineering(!isEngineering)}
      style={{
        background: 'none',
        border: 'none',
        color: isEngineering ? '#22d3ee' : '#fff',
        cursor: 'pointer',
        padding: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        backgroundColor: isEngineering ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255, 255, 255, 0.15)',
        transition: 'all 0.2s',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
      title={isEngineering ? "일반 계산기 모드" : "공학 계산기 모드"}
    >
      {isEngineering ? <Calculator size={20} /> : <Sigma size={20} />}
    </button>
  );

  return (
    <AppContainer title="계산기" onBack={onBack} headerAction={headerAction}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '5px', gap: '8px' }}>
        
        <div className="calc-chassis">
          {/* Display */}
          <div className="calc-display">
            {(() => {
              const eqStr = justEvaluated && lastCalc ? `${formatExpression(lastCalc.eq)} =` : '';
              const resStr = formatExpression(expression) || '0';
              const isOverflow = eqStr.length + resStr.length > 18;
              
              let resFontSize = '2.5rem';
              if (isOverflow) {
                if (resStr.length > 25) resFontSize = '1rem';
                else if (resStr.length > 15) resFontSize = '1.2rem';
                else resFontSize = '1.8rem';
              } else {
                if (resStr.length > 30) resFontSize = '0.9rem';
                else if (resStr.length > 22) resFontSize = '1.1rem';
                else if (resStr.length > 16) resFontSize = '1.4rem';
                else if (resStr.length > 11) resFontSize = '1.8rem';
                else resFontSize = '2.5rem';
              }

              return (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: isOverflow ? 'column' : 'row', 
                  justifyContent: isOverflow ? 'center' : 'space-between', 
                  alignItems: isOverflow ? 'flex-end' : 'flex-end', 
                  position: 'relative', 
                  zIndex: 1, 
                  width: '100%', 
                  gap: isOverflow ? '4px' : '8px' 
                }}>
                  <div style={{ 
                    color: '#9ca3af', 
                    fontSize: isOverflow ? '0.9rem' : '1rem', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: isOverflow ? 'right' : 'left', 
                    marginBottom: isOverflow ? '0' : '4px', 
                    flexShrink: 0, 
                    maxWidth: isOverflow ? '100%' : '40%' 
                  }}>
                    {eqStr}
                  </div>
                  <div style={{ 
                    color: '#fff', 
                    fontSize: resFontSize, 
                    fontWeight: '500', 
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'right', 
                    lineHeight: 1.2, 
                    flex: 1,
                    width: isOverflow ? '100%' : 'auto'
                  }}>
                    {resStr}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Keypad */}
          <div className="calc-keypad">
            {isEngineering && (
              <>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('sin(')}>sin</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('cos(')}>cos</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('tan(')}>tan</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('log(')}>log</button>

                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('asin(')}>sin⁻¹</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('acos(')}>cos⁻¹</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('atan(')}>tan⁻¹</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('ln(')}>ln</button>

                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('^2')}>x²</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('^')}>x^y</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('√(')}>√</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('abs(')}>|x|</button>

                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('e')}>e</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('π')}>π</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={() => handleInput('e^')}>e^x</button>
                <button className="calc-btn op-top" style={{fontSize: '1.1rem'}} onClick={handleNegate}>+/-</button>
              </>
            )}
            
            <button className="calc-btn op-top" onClick={handleClear}>C</button>
            <button className="calc-btn op-top" onClick={handleBackspace}><Delete size={24} /></button>
            <button className="calc-btn op-top" onClick={() => handleInput('%')}>%</button>
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
            
            <button className="calc-btn" onClick={handleParentheses}>()</button>
            <button className="calc-btn" onClick={() => handleInput('0')}>0</button>
            <button className="calc-btn" onClick={() => handleInput('.')}>.</button>
            <button className="calc-btn op-right" onClick={handleEqual}>=</button>
          </div>
        </div>
        
        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem' }}>저장된 계산 (최대 5개)</h3>
          <button 
            onClick={handleSave}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', 
              border: 'none', borderRadius: '14px', padding: '10px 20px', 
              fontSize: '1.05rem', fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}>
            <Save size={20} /> 저장하기
          </button>
        </div>

        {/* Saved List */}
        <div className="saved-list-container">
          {savedList.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.9rem' }}>
              = 버튼을 눌러 계산을 완료한 후,<br/>저장하기 버튼을 눌러보세요!
            </div>
          ) : (
            savedList.map((calc, index) => {
              const pastelColors = ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#fbcfe8'];
              const borderColor = pastelColors[index % pastelColors.length];
              return (
                <div key={calc.id} className="notebook-card" style={{ borderLeftColor: borderColor }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>({new Date(calc.id).getMonth() + 1}/{new Date(calc.id).getDate()})</span>
                      <strong style={{ color: '#1f2937', fontSize: '0.95rem' }}>{calc.name}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => handleShare(calc)}
                        style={{ background: 'none', border: 'none', color: '#0284c7', padding: '2px', cursor: 'pointer' }}>
                        <Share2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSaved(calc.id)}
                        style={{ background: 'none', border: 'none', color: '#e11d48', padding: '2px', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4px' }}>
                    <span style={{ color: '#4b5563', fontSize: '0.85rem', fontFamily: 'monospace' }}>{formatExpression(calc.equation)}</span>
                    <strong style={{ color: '#dc2626', fontSize: '1.1rem' }}>{formatExpression(calc.result)}</strong>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppContainer>
  );
}
