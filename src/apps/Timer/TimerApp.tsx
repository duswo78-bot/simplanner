import React, { useState, useEffect, useRef } from 'react';
import { AppContainer } from '../../components/AppContainer';
import { Play, Pause, Square, Plus, Trash2, Volume2 } from 'lucide-react';

interface TimerAppProps {
  onBack: () => void;
}

interface TimerItem {
  id: number;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export function TimerApp({ onBack }: TimerAppProps) {
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState(5);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimers(prevTimers => {
        let hasChanges = false;
        const updatedTimers = prevTimers.map(timer => {
          if (timer.isRunning && timer.remainingSeconds > 0) {
            hasChanges = true;
            const newRemaining = timer.remainingSeconds - 1;
            if (newRemaining === 0) {
              // TTS 알림
              playTTS(timer.label);
              return { ...timer, remainingSeconds: 0, isRunning: false };
            }
            return { ...timer, remainingSeconds: newRemaining };
          }
          return timer;
        });
        return hasChanges ? updatedTimers : prevTimers;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const playTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(`${text} 시간이 다 되었습니다.`);
    utterance.lang = 'ko-KR';
    window.speechSynthesis.speak(utterance);
  };

  const addTimer = () => {
    if (newMinutes <= 0) return;
    const newTimer: TimerItem = {
      id: Date.now(),
      label: newLabel || '타이머',
      totalSeconds: newMinutes * 60,
      remainingSeconds: newMinutes * 60,
      isRunning: false,
    };
    setTimers([...timers, newTimer]);
    setNewLabel('');
  };

  const toggleTimer = (id: number) => {
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning } : t
    ));
  };

  const stopTimer = (id: number) => {
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: false, remainingSeconds: t.totalSeconds } : t
    ));
  };

  const deleteTimer = (id: number) => {
    setTimers(timers.filter(t => t.id !== id));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <AppContainer title="스마트 타이머" onBack={onBack}>
      <div style={{ padding: '20px', color: '#fff', height: '100%', overflowY: 'auto' }}>
        
        {/* 타이머 추가 UI */}
        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '16px', 
          borderRadius: '16px',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#e2e8f0' }}>새 타이머 추가</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input 
              type="text" 
              placeholder="예: 빨래 널기" 
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{
                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                background: 'rgba(0,0,0,0.3)', color: '#fff'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '0 10px', borderRadius: '8px' }}>
              <input 
                type="number" 
                value={newMinutes}
                onChange={(e) => setNewMinutes(Number(e.target.value))}
                style={{
                  width: '50px', padding: '10px 0', border: 'none',
                  background: 'transparent', color: '#fff', textAlign: 'right'
                }}
              />
              <span style={{ color: '#94a3b8' }}>분</span>
            </div>
          </div>
          <button 
            onClick={addTimer}
            style={{
              width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              background: '#3b82f6', color: '#fff', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} /> 추가하기
          </button>
        </div>

        {/* 타이머 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {timers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', marginTop: '40px' }}>등록된 타이머가 없습니다.</p>
          ) : (
            timers.map(timer => (
              <div key={timer.id} style={{ 
                background: 'linear-gradient(145deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))',
                borderRadius: '16px', padding: '20px',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {timer.remainingSeconds === 0 && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' }} />
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{timer.label}</h4>
                    <Volume2 size={16} color="#3b82f6" />
                  </div>
                  <button 
                    onClick={() => deleteTimer(timer.id)}
                    style={{ background: 'none', border: 'none', color: '#64748b', padding: 0, cursor: 'pointer' }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div style={{ fontSize: '3rem', fontWeight: 'bold', fontFamily: 'monospace', textAlign: 'center', color: timer.remainingSeconds === 0 ? '#ef4444' : '#fff', marginBottom: '20px' }}>
                  {formatTime(timer.remainingSeconds)}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <button 
                    onClick={() => toggleTimer(timer.id)}
                    style={{ 
                      width: '60px', height: '60px', borderRadius: '30px', border: 'none',
                      background: timer.isRunning ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)',
                      color: timer.isRunning ? '#ef4444' : '#3b82f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {timer.isRunning ? <Pause size={28} /> : <Play size={28} style={{ marginLeft: '4px' }} />}
                  </button>
                  <button 
                    onClick={() => stopTimer(timer.id)}
                    style={{ 
                      width: '60px', height: '60px', borderRadius: '30px', border: 'none',
                      background: 'rgba(100,116,139,0.2)', color: '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Square size={24} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppContainer>
  );
}
