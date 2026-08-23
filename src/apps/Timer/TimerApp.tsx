import React, { useState, useEffect, useRef } from 'react';
import { AppContainer } from '../../components/AppContainer';
import { Play, Pause, Square, Plus, Trash2, Volume2 } from 'lucide-react';
import { soundManager } from '../../utils/SoundManager';

interface TimerAppProps {
  onBack: () => void;
}

interface TimerItem {
  id: number;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  type: 'duration' | 'targetTime';
  targetEpochMs?: number;
  isRinging?: boolean;
  lastTtsTime?: number;
}

export function TimerApp({ onBack }: TimerAppProps) {
  const [timers, setTimers] = useState<TimerItem[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [timerMode, setTimerMode] = useState<'duration' | 'targetTime'>('duration');
  const [newMinutes, setNewMinutes] = useState(5);
  const [targetTimeStr, setTargetTimeStr] = useState('12:00');
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimers(prevTimers => {
        let hasChanges = false;
        const now = Date.now();
        const updatedTimers = prevTimers.map(timer => {
          if (timer.isRinging) {
            // TTS 20초 주기 반복
            if (now - (timer.lastTtsTime || 0) >= 20000) {
              playTTS(timer.label);
              hasChanges = true;
              return { ...timer, lastTtsTime: now };
            }
            return timer;
          }

          if (timer.isRunning && timer.remainingSeconds > 0) {
            hasChanges = true;
            let newRemaining = timer.remainingSeconds;
            
            if (timer.type === 'targetTime' && timer.targetEpochMs) {
              newRemaining = Math.max(0, Math.floor((timer.targetEpochMs - now) / 1000));
            } else {
              newRemaining = timer.remainingSeconds - 1;
            }

            if (newRemaining === 0) {
              // 최초 알람 및 TTS
              playTTS(timer.label);
              soundManager.startAlarm();
              return { ...timer, remainingSeconds: 0, isRunning: false, isRinging: true, lastTtsTime: now };
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
    let newTimer: TimerItem;
    if (timerMode === 'duration') {
      if (newMinutes <= 0) return;
      newTimer = {
        id: Date.now(),
        label: newLabel || '타이머',
        totalSeconds: newMinutes * 60,
        remainingSeconds: newMinutes * 60,
        isRunning: false,
        type: 'duration'
      };
    } else {
      if (!targetTimeStr) return;
      const [hours, minutes] = targetTimeStr.split(':').map(Number);
      const now = new Date();
      const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1); // tomorrow
      }
      const targetEpochMs = target.getTime();
      const remSecs = Math.max(0, Math.floor((targetEpochMs - Date.now()) / 1000));
      newTimer = {
        id: Date.now(),
        label: newLabel || '알람',
        totalSeconds: remSecs,
        remainingSeconds: remSecs,
        isRunning: true, // auto start
        type: 'targetTime',
        targetEpochMs
      };
    }
    setTimers([...timers, newTimer]);
    setNewLabel('');
  };

  const toggleTimer = (id: number) => {
    soundManager.stopAlarm();
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: !t.isRunning, isRinging: false } : t
    ));
  };

  const stopTimer = (id: number) => {
    soundManager.stopAlarm();
    setTimers(timers.map(t => 
      t.id === id ? { ...t, isRunning: false, isRinging: false, remainingSeconds: t.type === 'targetTime' ? 0 : t.totalSeconds } : t
    ));
  };

  const deleteTimer = (id: number) => {
    soundManager.stopAlarm();
    setTimers(timers.filter(t => t.id !== id));
  };

  useEffect(() => {
    return () => {
      soundManager.stopAlarm();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (h > 0) return `${h}:${m}:${s}`;
    return `${m}:${s}`;
  };

  return (
    <AppContainer title="스마트 타이머" onBack={onBack}>
      <div style={{ 
        padding: '20px', 
        height: '100%', 
        overflowY: 'auto',
        background: `linear-gradient(rgba(15, 23, 42, 0.45), rgba(15, 23, 42, 0.8)), url('https://images.unsplash.com/photo-1501139083538-0139583c060f?q=80&w=1000&auto=format&fit=crop')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}>
        
        {/* 타이머 추가 UI */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={20} color="#38bdf8" /> 
            새 타이머 추가
          </h3>
          
          {/* 탭 버튼 */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '4px' }}>
            <button 
              onClick={() => setTimerMode('duration')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: timerMode === 'duration' ? 'rgba(255,255,255,0.15)' : 'transparent', color: timerMode === 'duration' ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              모래시계(시간 길이)
            </button>
            <button 
              onClick={() => setTimerMode('targetTime')}
              style={{ flex: 1, padding: '8px', border: 'none', borderRadius: '8px', background: timerMode === 'targetTime' ? 'rgba(255,255,255,0.15)' : 'transparent', color: timerMode === 'targetTime' ? '#fff' : '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              알람(목표 시각)
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input 
              type="text" 
              placeholder="예: 빨래 널기" 
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: 'none',
                background: 'rgba(0,0,0,0.4)', color: '#fff', outline: 'none'
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', padding: '0 12px', borderRadius: '12px' }}>
              {timerMode === 'duration' ? (
                <>
                  <input 
                    type="number" 
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(Number(e.target.value))}
                    style={{ width: '50px', padding: '12px 0', border: 'none', background: 'transparent', color: '#fff', textAlign: 'right', outline: 'none' }}
                  />
                  <span style={{ color: '#94a3b8' }}>분</span>
                </>
              ) : (
                <input 
                  type="time" 
                  value={targetTimeStr}
                  onChange={(e) => setTargetTimeStr(e.target.value)}
                  style={{ padding: '12px 0', border: 'none', background: 'transparent', color: '#fff', outline: 'none', width: '110px' }}
                />
              )}
            </div>
          </div>
          <button 
            onClick={addTimer}
            style={{
              width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #38bdf8, #2563eb)', color: '#fff', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={20} /> 추가하기
          </button>
        </div>

        {/* 타이머 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {timers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Square size={48} opacity={0.5} />
              <p>등록된 타이머가 없습니다.</p>
            </div>
          ) : (
            timers.map(timer => {
              const progress = timer.remainingSeconds / timer.totalSeconds;
              const radius = 90;
              const circumference = 2 * Math.PI * radius;
              const offset = circumference * (1 - progress);
              const color = timer.remainingSeconds === 0 ? '#ef4444' : '#38bdf8';

              return (
                <div key={timer.id} style={{ 
                  background: 'rgba(15,23,42,0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '24px', padding: '24px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>{timer.label}</h4>
                      <Volume2 size={18} color={color} />
                    </div>
                    <button 
                      onClick={() => deleteTimer(timer.id)}
                      style={{ background: 'none', border: 'none', color: '#64748b', padding: '4px', cursor: 'pointer' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  {/* 원형 프로그레스 바 */}
                  <div style={{ position: 'relative', width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <svg width="220" height="220" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                      <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                      <circle cx="110" cy="110" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={circumference} 
                        strokeDashoffset={offset} 
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                      />
                    </svg>
                    <div style={{ fontSize: '3.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: color, position: 'relative', zIndex: 2, letterSpacing: '-2px' }}>
                      {formatTime(timer.remainingSeconds)}
                    </div>
                  </div>
                                    {/* 컨트롤 버튼 */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                      {timer.type === 'duration' && (
                        <button 
                          onClick={() => toggleTimer(timer.id)}
                          style={{ 
                            width: '64px', height: '64px', borderRadius: '32px', border: 'none',
                            background: timer.isRunning ? 'rgba(255,255,255,0.1)' : 'rgba(56, 189, 248, 0.2)', 
                            color: timer.isRunning ? '#cbd5e1' : '#38bdf8',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s ease'
                          }}
                        >
                          {timer.isRunning ? <Pause size={30} /> : <Play size={30} style={{ marginLeft: '4px' }} />}
                        </button>
                      )}
                      <button 
                        onClick={() => stopTimer(timer.id)}
                        style={{ 
                          width: '64px', height: '64px', borderRadius: '32px', border: 'none',
                          background: 'rgba(255,255,255,0.1)', color: '#cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', transition: 'all 0.2s ease'
                        }}
                      >
                        <Square size={24} />
                      </button>
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
