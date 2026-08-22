import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Mic, Calendar as CalIcon, MapPin, Users, Check, Plus, X, Repeat, CornerDownLeft } from 'lucide-react';
import { useSchedule, isEventOccurringOnDate, getYYYYMMDD } from '../shared/ScheduleContext';
import { parseInput, type ParsedInput } from '../shared/nlParser';
import type { ScheduleEvent, Memo, RecurrenceType } from '../shared/ScheduleContext';
import { downloadIcsForEvent } from '../shared/icsHelper';
import { PlannerCalendarModal } from './PlannerCalendarModal';
import { pushToCarLedger } from '../shared/EventBus';
import './PlannerApp.css';

interface PlannerAppProps {
  onBack: () => void;
}

export function PlannerApp({ onBack }: PlannerAppProps) {
  const { events, memos, addEvent, addMemo, toggleEventCompletion } = useSchedule();
  const [inputText, setInputText] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<ParsedInput | null>(null);
  const [syncToPhone, setSyncToPhone] = useState(false);
  const [syncToCarLedger, setSyncToCarLedger] = useState(false);

  const getRecurrenceLabel = (recurrence: string) => {
    if (recurrence === 'none') return '반복 안함';
    if (recurrence === 'daily:1') return '매일';
    if (recurrence === 'weekly:1') return '매주';
    if (recurrence === 'monthly:1') return '매달';
    if (recurrence === 'yearly:1') return '매년';
    
    const [base, intervalStr] = recurrence.split(':');
    if (!intervalStr) return '반복';
    
    if (base === 'daily') return `${intervalStr}일마다`;
    if (base === 'weekly') return `${intervalStr}주마다`;
    if (base === 'monthly') return `${intervalStr}개월마다`;
    if (base === 'yearly') return `${intervalStr}년마다`;
    if (base === 'freq') {
      const [freqBase, freqInterval] = intervalStr.split(':'); // wait, the structure for freq is freq:weekly:N
      // Wait, recurrence is freq:weekly:3. split(':') gives base='freq', intervalStr='weekly'
      return recurrence.replace('freq:weekly:', '주 ').replace('freq:monthly:', '월 ').replace('freq:yearly:', '연 ') + '회';
    }
    return recurrence;
  };
  
  // STT State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setInputText(prev => prev ? prev + ' ' + finalTranscript : finalTranscript);
        } else if (interimTranscript) {
          setInputText(interimTranscript);
        }
      };
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };
      recognition.onend = () => setIsRecording(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInputText('');
      recognitionRef.current?.start();
    }
  };

  const SUGGESTIONS = [
    "매일 아침 9시 영양제 먹기",
    "매주 화요일 2시 주간회의",
    "매달 25일 월급날",
    "우유 사기",
    "오늘 저녁 식사 예약"
  ];

  const handleSuggestionClick = (text: string) => {
    setInputText(text);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const parsed = parseInput(inputText);
    if (parsed.type === 'error') {
      alert(parsed.errorMsg);
      return;
    }
    setPendingEvent(parsed);
  };

  const handleConfirmCancel = () => {
    setPendingEvent(null);
  };

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEvent) return;

    if (pendingEvent.type === 'memo') {
      addMemo({ content: pendingEvent.what, tag: '메모' });
    } else {
      if (!pendingEvent.what.trim()) {
        alert("내용을 입력해주세요.");
        return;
      }
      addEvent({
        what: pendingEvent.what,
        when: pendingEvent.when,
        where: pendingEvent.where,
        isTodo: pendingEvent.isTodo,
        completed: false,
        status: 'todo',
        recurrence: pendingEvent.recurrence,
      });

      if (syncToPhone) {
        downloadIcsForEvent(pendingEvent as any);
      }

      if (syncToCarLedger) {
        pushToCarLedger(
          'maintenance',
          {
            date: pendingEvent.when.split('T')[0],
            category: '점검', // Default to inspection
            amount: 0,
            memo: `[플래너] ${pendingEvent.what}`
          }
        );
      }
    }
    setPendingEvent(null);
    setInputText('');
    setSyncToPhone(false);
    setSyncToCarLedger(false);
  };

  const addSimpleTodo = () => {
    const what = prompt("할일을 입력하세요:");
    if (what) {
      addEvent({
        what,
        when: new Date().toISOString(),
        isTodo: true,
        completed: false,
        status: 'todo',
        recurrence: 'none'
      });
    }
  };

  const addSimpleMemo = () => {
    const content = prompt("메모를 입력하세요:");
    if (content) {
      addMemo({ content, tag: '메모' });
    }
  };

  const today = new Date();
  const todayStr = getYYYYMMDD(today);

  const todaysEvents = useMemo(() => {
    return events
      .filter(e => !e.isTodo && isEventOccurringOnDate(e, today))
      .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());
  }, [events, today]);

  const todos = useMemo(() => {
    return events.filter(e => e.isTodo && isEventOccurringOnDate(e, today));
  }, [events, today]);
  
  const recentMemos = memos.slice(0, 3);

  const getDotColor = (index: number) => {
    const colors = ['dot-red', 'dot-blue', 'dot-orange', 'dot-purple'];
    return colors[index % colors.length];
  };

  const isTodoCompletedToday = (todo: ScheduleEvent) => {
    if (todo.recurrence && todo.recurrence !== 'none') {
      return (todo.completedDates || []).includes(todayStr);
    }
    return todo.completed;
  };

  return (
    <div className="planner-app animate-fade-in">
      <div className="planner-header">
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={20} color="#44403c" />
        </button>
        <h2>플래너</h2>
      </div>

      <div className="planner-content">
        <div className="universal-input-container">
          <form className="universal-input-box" onSubmit={handleInputSubmit}>
            <input
              type="text"
              placeholder="무엇이든 적어보세요..."
              className="universal-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="input-actions">
              <button type="button" onClick={handleMicClick} className={`input-action-btn mic-btn ${isRecording ? 'recording' : ''}`}>
                <Mic size={16} strokeWidth={2.5} />
              </button>
              <button type="submit" className={`input-action-btn send-btn ${inputText.trim().length > 0 ? 'active' : ''}`}>
                <CornerDownLeft size={16} strokeWidth={2.5} />
              </button>
            </div>
          </form>
          {!pendingEvent && (
            <div className="chips-container">
              <span className="chip label-chip">예시</span>
              {SUGGESTIONS.map((suggestion, idx) => (
                <span key={idx} className="chip" onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </span>
              ))}
            </div>
          )}

          {/* Confirmation UI */}
          {pendingEvent && (
            <div className="confirmation-card animate-slide-down">
              <div className="confirmation-header">
                <h3>입력 내용 확인</h3>
              </div>
              <form onSubmit={handleConfirmSubmit} className="confirmation-form">
                <div className="form-group">
                  <label>분류</label>
                  <select 
                    value={pendingEvent.type === 'memo' ? 'memo' : (pendingEvent.isTodo ? 'todo' : 'event')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'memo') setPendingEvent({ ...pendingEvent, type: 'memo', isTodo: false });
                      else if (val === 'todo') setPendingEvent({ ...pendingEvent, type: 'event', isTodo: true });
                      else setPendingEvent({ ...pendingEvent, type: 'event', isTodo: false });
                    }}
                    className="form-input"
                  >
                    <option value="event">일정</option>
                    <option value="todo">할일</option>
                    <option value="memo">메모</option>
                  </select>
                </div>

                {pendingEvent.type !== 'memo' && (
                  <div className="form-group">
                    <label>반복</label>
                    <select 
                      value={pendingEvent.recurrence}
                      onChange={(e) => setPendingEvent({ ...pendingEvent, recurrence: e.target.value as any })}
                      className="form-input"
                    >
                      <option value="none">반복 안함</option>
                      <option value="daily:1">매일</option>
                      <option value="weekly:1">매주</option>
                      <option value="monthly:1">매달</option>
                      <option value="yearly:1">매년</option>
                      {!['none', 'daily:1', 'weekly:1', 'monthly:1', 'yearly:1'].includes(pendingEvent.recurrence) && (
                        <option value={pendingEvent.recurrence}>{getRecurrenceLabel(pendingEvent.recurrence)}</option>
                      )}
                    </select>
                  </div>
                )}
                
                <div className="form-group full-width">
                  <label>내용</label>
                  <input 
                    type="text" 
                    value={pendingEvent.what} 
                    onChange={(e) => setPendingEvent({ ...pendingEvent, what: e.target.value })}
                    className="form-input"
                  />
                </div>

                {pendingEvent.type !== 'memo' && (
                  <>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label>날짜 및 시간</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          className="form-input"
                          readOnly
                          value={(() => {
                            if (!pendingEvent.when) return '지정 안됨';
                            const d = new Date(pendingEvent.when);
                            const m = d.getMonth() + 1;
                            const day = d.getDate();
                            const h = d.getHours();
                            const min = d.getMinutes().toString().padStart(2, '0');
                            const ampm = h < 12 ? '오전' : '오후';
                            const h12 = h % 12 || 12;
                            return `${m}/${day} ${ampm} ${h12}:${min}`;
                          })()}
                          style={{ cursor: 'pointer', textAlign: 'center', paddingRight: '28px' }}
                          onClick={() => dateInputRef.current?.showPicker()}
                        />
                        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                          <CalIcon size={16} color="#a8a29e" />
                        </div>
                      </div>
                      <input 
                        ref={dateInputRef}
                        type="datetime-local" 
                        value={pendingEvent.when ? new Date(new Date(pendingEvent.when).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setPendingEvent({ ...pendingEvent, when: new Date(e.target.value).toISOString() })}
                        style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, padding: 0, border: 'none', opacity: 0, pointerEvents: 'none' }}
                      />
                    </div>
                    <div className="form-group">
                      <label>장소</label>
                      <input 
                        type="text" 
                        value={pendingEvent.where} 
                        onChange={(e) => setPendingEvent({ ...pendingEvent, where: e.target.value })}
                        className="form-input"
                        placeholder="없음"
                      />
                    </div>
                    <div className="form-group full-width" style={{ marginTop: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#10b981', fontWeight: 600 }}>
                        <input 
                          type="checkbox" 
                          checked={syncToPhone} 
                          onChange={(e) => setSyncToPhone(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                        />
                        폰 캘린더에도 저장
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#3b82f6', fontWeight: 600, marginTop: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={syncToCarLedger} 
                          onChange={(e) => setSyncToCarLedger(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                        />
                        차량 관리 일정에도 추가
                      </label>
                    </div>
                  </>
                )}

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={handleConfirmCancel}>취소</button>
                  <button type="submit" className="btn-confirm">OK 등록</button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Today's Schedule Widget */}
        <div className="widget-card">
          <div className="widget-header">
            <div className="widget-title">
              <CalIcon size={20} color="#f87171" />
              오늘 일정
            </div>
            <button className="widget-action" onClick={() => setShowCalendar(true)}>
              전체 보기 &gt;
            </button>
          </div>
          
          <div className="schedule-list">
            {todaysEvents.map((event, idx) => {
              const d = new Date(event.when);
              const hour = d.getHours();
              const min = d.getMinutes().toString().padStart(2, '0');
              const endHour = hour + 1;
              return (
                <div key={event.id} className="schedule-item">
                  <div className="schedule-time">
                    <span>{hour.toString().padStart(2, '0')}:{min}</span>
                    <span className="end-time">{endHour.toString().padStart(2, '0')}:{min}</span>
                  </div>
                  <div className={`schedule-dot ${getDotColor(idx)}`} />
                  <div className="schedule-details">
                    <h4>
                      {event.recurrence && event.recurrence !== 'none' && <Repeat size={12} color="#57534e" style={{ marginRight: 4, display: 'inline' }} />}
                      {event.what}
                    </h4>
                    {event.where && (
                      <div className="schedule-location">
                        <MapPin size={12} color="#78716c" /> {event.where}
                      </div>
                    )}
                  </div>
                  <div className="schedule-icon-right">
                    <CalIcon size={16} color="#78716c" />
                  </div>
                </div>
              );
            })}
            {todaysEvents.length === 0 && (
              <div style={{ fontSize: '0.9rem', color: '#78716c', textAlign: 'center', padding: '20px 0' }}>
                오늘 일정이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Widgets */}
        <div className="bottom-widgets">
          {/* Today's Todo */}
          <div className="widget-card" style={{ flex: 1.2 }}>
            <div className="widget-header">
              <div className="widget-title">
                <Check size={20} color="#fb923c" />
                오늘 할일
              </div>
              <button className="add-btn-small" onClick={addSimpleTodo}>
                <Plus size={16} color="#ea580c" />
              </button>
            </div>
            
            <div className="todo-list-compact">
              {todos.map(todo => {
                const isCompleted = isTodoCompletedToday(todo);
                return (
                  <div key={todo.id} className={`todo-item-compact ${isCompleted ? 'checked' : ''}`}>
                    <div className={`todo-checkbox-square ${isCompleted ? 'checked' : ''}`} onClick={() => toggleEventCompletion(todo.id, todayStr)}>
                      {isCompleted && <Check size={14} color="white" />}
                    </div>
                    <span>
                      {todo.recurrence && todo.recurrence !== 'none' && <Repeat size={12} color="#57534e" style={{ marginRight: 4, display: 'inline' }} />}
                      {todo.what}
                    </span>
                  </div>
                );
              })}
              {todos.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: '#78716c' }}>할일이 없습니다.</div>
              )}
            </div>
          </div>

          {/* Recent Memos */}
          <div className="widget-card" style={{ flex: 1 }}>
            <div className="widget-header">
              <div className="widget-title">
                <span style={{ color: '#a78bfa' }}>📝</span>
                최근 메모
              </div>
              <button className="add-btn-small" onClick={addSimpleMemo}>
                <Plus size={16} color="#ea580c" />
              </button>
            </div>
            
            <div className="memo-list">
              {recentMemos.map((memo) => (
                <div key={memo.id} className="memo-card">
                  <h4>{memo.content}</h4>
                  <div className="memo-meta">
                    <span style={{ color: '#ea580c' }}><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }}/> 메모</span>
                    <span style={{ color: '#78716c' }}>{new Date(memo.createdAt).getMonth()+1}.{new Date(memo.createdAt).getDate()}</span>
                  </div>
                </div>
              ))}
              {recentMemos.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: '#78716c' }}>메모가 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <PlannerCalendarModal 
          onClose={() => setShowCalendar(false)} 
          toggleEventCompletion={toggleEventCompletion} 
        />
      )}
    </div>
  );
}
