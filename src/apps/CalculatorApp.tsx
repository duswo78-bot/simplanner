import React, { useState } from 'react';
import { AppContainer } from '../components/AppContainer';

interface CalculatorAppProps {
  onBack: () => void;
}

export function CalculatorApp({ onBack }: CalculatorAppProps) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [prevValue, setPrevValue] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

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
      setDisplay(String(result));
      setEquation('');
      setPrevValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
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

  const buttonStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '16px',
    color: '#fff',
    fontSize: '1.5rem',
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', gap: '20px' }}>
        
        {/* Display */}
        <div style={{ 
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end',
          padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', minHeight: '120px'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.2rem', minHeight: '1.5rem', marginBottom: '8px' }}>
            {equation}
          </div>
          <div style={{ color: '#fff', fontSize: display.length > 10 ? '2.5rem' : '4rem', fontWeight: 'bold', wordBreak: 'break-all', textAlign: 'right', lineHeight: 1 }}>
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', 
          gap: '12px', flex: 2
        }}>
          {/* Row 1 */}
          <button style={topOpStyle} onClick={handleClear} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseUp={e => e.currentTarget.style.background = topOpStyle.background} onMouseLeave={e => e.currentTarget.style.background = topOpStyle.background}>C</button>
          <button style={topOpStyle} onClick={handlePlusMinus} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseUp={e => e.currentTarget.style.background = topOpStyle.background} onMouseLeave={e => e.currentTarget.style.background = topOpStyle.background}>+/-</button>
          <button style={topOpStyle} onClick={handlePercent} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseUp={e => e.currentTarget.style.background = topOpStyle.background} onMouseLeave={e => e.currentTarget.style.background = topOpStyle.background}>%</button>
          <button style={opStyle} onClick={() => handleOp('÷')} onMouseDown={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 1)'} onMouseUp={e => e.currentTarget.style.background = opStyle.background} onMouseLeave={e => e.currentTarget.style.background = opStyle.background}>÷</button>
          
          {/* Row 2 */}
          <button style={buttonStyle} onClick={() => handleNum('7')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>7</button>
          <button style={buttonStyle} onClick={() => handleNum('8')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>8</button>
          <button style={buttonStyle} onClick={() => handleNum('9')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>9</button>
          <button style={opStyle} onClick={() => handleOp('×')} onMouseDown={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 1)'} onMouseUp={e => e.currentTarget.style.background = opStyle.background} onMouseLeave={e => e.currentTarget.style.background = opStyle.background}>×</button>
          
          {/* Row 3 */}
          <button style={buttonStyle} onClick={() => handleNum('4')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>4</button>
          <button style={buttonStyle} onClick={() => handleNum('5')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>5</button>
          <button style={buttonStyle} onClick={() => handleNum('6')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>6</button>
          <button style={opStyle} onClick={() => handleOp('-')} onMouseDown={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 1)'} onMouseUp={e => e.currentTarget.style.background = opStyle.background} onMouseLeave={e => e.currentTarget.style.background = opStyle.background}>-</button>
          
          {/* Row 4 */}
          <button style={buttonStyle} onClick={() => handleNum('1')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>1</button>
          <button style={buttonStyle} onClick={() => handleNum('2')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>2</button>
          <button style={buttonStyle} onClick={() => handleNum('3')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>3</button>
          <button style={opStyle} onClick={() => handleOp('+')} onMouseDown={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 1)'} onMouseUp={e => e.currentTarget.style.background = opStyle.background} onMouseLeave={e => e.currentTarget.style.background = opStyle.background}>+</button>
          
          {/* Row 5 */}
          <button style={{ ...buttonStyle, gridColumn: 'span 2' }} onClick={() => handleNum('0')} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>0</button>
          <button style={buttonStyle} onClick={handleDot} onMouseDown={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseUp={e => e.currentTarget.style.background = buttonStyle.background} onMouseLeave={e => e.currentTarget.style.background = buttonStyle.background}>.</button>
          <button style={opStyle} onClick={handleEqual} onMouseDown={e => e.currentTarget.style.background = 'rgba(245, 158, 11, 1)'} onMouseUp={e => e.currentTarget.style.background = opStyle.background} onMouseLeave={e => e.currentTarget.style.background = opStyle.background}>=</button>
        </div>
        
      </div>
    </AppContainer>
  );
}
