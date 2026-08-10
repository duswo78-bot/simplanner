import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, CalendarX2 } from 'lucide-react';

const getEventEmoji = (eventName: string) => {
  if (eventName.includes('여름방학')) return '🍉';
  if (eventName.includes('겨울방학')) return '⛄';
  if (eventName.includes('방학')) return '🏖️';
  if (eventName.includes('개학')) return '🎒';
  if (eventName.includes('모의평가') || eventName.includes('고사') || eventName.includes('시험') || eventName.includes('평가')) return '📝';
  if (eventName.includes('체육') || eventName.includes('스포츠')) return '🏅';
  if (eventName.includes('수학여행') || eventName.includes('수련') || eventName.includes('체험') || eventName.includes('소풍')) return '🚌';
  if (eventName.includes('축제') || eventName.includes('예술제') || eventName.includes('학예회')) return '🎉';
  if (eventName.includes('졸업')) return '🎓';
  if (eventName.includes('입학')) return '🌸';
  if (eventName.includes('방과후')) return '📚';
  if (eventName.includes('개교기념일')) return '🎂';
  if (eventName.includes('방학식') || eventName.includes('종업식')) return '👋';
  if (eventName.includes('학부모')) return '👨‍👩‍👧‍👦';
  if (eventName.includes('건강검진') || eventName.includes('신체검사') || eventName.includes('예방접종')) return '🩺';
  return '📌';
};

interface SchoolInfo {
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  grade?: string;
}

interface SchoolCalendarProps {
  activeSchool: SchoolInfo;
}

export function SchoolCalendar({ activeSchool }: SchoolCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startOffset = firstDay.getDay(); // Sunday start
  const daysInMonth = lastDay.getDate();

  useEffect(() => {
    async function fetchSchedule() {
      setIsLoading(true);
      setError(null);
      setEvents({});
      try {
        const apiKey = import.meta.env.VITE_MEAL_API_KEY || '4027363c70984711b7cb0b491d50a922';
        
        const fromStr = `${year}${String(month + 1).padStart(2, '0')}01`;
        const toStr = `${year}${String(month + 1).padStart(2, '0')}${String(daysInMonth).padStart(2, '0')}`;

        const url = `https://open.neis.go.kr/hub/SchoolSchedule?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${activeSchool.officeCode}&SD_SCHUL_CODE=${activeSchool.schoolCode}&AA_FROM_YMD=${fromStr}&AA_TO_YMD=${toStr}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const newEvents: Record<string, string[]> = {};
        
        if (data.SchoolSchedule && data.SchoolSchedule[1].row) {
          data.SchoolSchedule[1].row.forEach((row: any) => {
            const eventName = row.EVENT_NM;
            
            let isTargetGrade = true;
            if (activeSchool.grade && activeSchool.grade !== 'all') {
              const gradeKeys = [
                'ONE_GRADE_EVENT_YN', 
                'TW_GRADE_EVENT_YN', 
                'THREE_GRADE_EVENT_YN', 
                'FOUR_GRADE_EVENT_YN', 
                'FIV_GRADE_EVENT_YN', 
                'SIX_GRADE_EVENT_YN'
              ];
              const gradeIdx = parseInt(activeSchool.grade) - 1;
              const key = gradeKeys[gradeIdx];
              
              if (key && row[key] === 'N') {
                isTargetGrade = false;
              }
            }

            if (isTargetGrade && eventName && eventName !== '토요휴업일' && eventName !== '휴업일') {
              if (!newEvents[row.AA_YMD]) {
                newEvents[row.AA_YMD] = [];
              }
              // Prevent duplicate event names on same day (API sometimes sends duplicate rows per grade)
              if (!newEvents[row.AA_YMD].includes(eventName)) {
                newEvents[row.AA_YMD].push(eventName);
              }
            }
          });
        }
        setEvents(newEvents);
      } catch (err) {
        console.error(err);
        setError('학사일정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    }

    if (activeSchool) {
      fetchSchedule();
    }
  }, [activeSchool, year, month, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: '12px 8px', 
        borderRadius: '24px', 
        margin: '8px 0 24px 0', 
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{year}년 {month + 1}월</span>
            {isLoading && <Loader2 size={16} className="animate-spin" color="#3b82f6" />}
          </div>
          <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        {error ? (
          <div style={{ textAlign: 'center', color: '#ef4444', padding: '16px 0', fontSize: '0.9rem' }}>
            <CalendarX2 size={32} style={{ margin: '0 auto 8px auto', opacity: 0.8 }} />
            {error}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{d}</div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', gridAutoRows: '46px' }}>
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '46px' }} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const currentDayDate = new Date(year, month, day);
                const dayOfWeek = currentDayDate.getDay();
                const today = isToday(day);
                
                const dateKey = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
                const dayEvents = events[dateKey] || [];
                
                return (
                  <div 
                    key={day}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDateKey(dateKey);
                        document.getElementById(`event-${dateKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    style={{
                      height: '46px',
                      padding: '2px',
                      borderRadius: '8px',
                      background: selectedDateKey === dateKey ? 'rgba(59, 130, 246, 0.3)' : today ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.06)',
                      border: selectedDateKey === dateKey ? '1px solid #60a5fa' : today ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      cursor: dayEvents.length > 0 ? 'pointer' : 'default',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ 
                      fontSize: '0.85rem', 
                      textAlign: 'center', 
                      marginBottom: '2px',
                      fontWeight: today ? 'bold' : 'normal',
                      color: dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : '#fff'
                    }}>
                      {day}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflow: 'hidden' }}>
                      {dayEvents.map((ev, idx) => (
                        <div key={idx} style={{
                          fontSize: '0.5rem',
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#bfdbfe',
                          padding: '1px 3px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: '1.1'
                        }} title={ev}>
                          {ev}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* Event list view for the month */}
      {!isLoading && !error && Object.keys(events).length > 0 && (
        <div style={{ padding: '0 4px 24px 4px' }}>
          <h3 style={{ 
            fontSize: '1.1rem', 
            marginBottom: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <div style={{ width: '4px', height: '18px', background: 'linear-gradient(to bottom, #60a5fa, #3b82f6)', borderRadius: '4px' }} />
            이달의 주요 학사일정
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.keys(events).sort().map(dateKey => {
              const dayEvents = events[dateKey];
              const d = new Date(parseInt(dateKey.slice(0,4)), parseInt(dateKey.slice(4,6))-1, parseInt(dateKey.slice(6,8)));
              const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
              
              return (
                <div 
                  id={`event-${dateKey}`}
                  key={dateKey} 
                  className="glass-panel" 
                  style={{ 
                    padding: '10px 16px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    border: selectedDateKey === dateKey ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedDateKey === dateKey ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    boxShadow: selectedDateKey === dateKey ? '0 0 15px rgba(59,130,246,0.6)' : '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}>
                  <div style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 'bold', 
                    color: d.getDay() === 0 ? '#f87171' : d.getDay() === 6 ? '#60a5fa' : '#f8fafc',
                    minWidth: '56px',
                    whiteSpace: 'nowrap'
                  }}>
                    {d.getMonth()+1}.{d.getDate()}({dayOfWeek})
                  </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: '8px', alignItems: 'center', overflow: 'hidden' }}>
                      {dayEvents.map((ev, idx) => {
                        const emoji = getEventEmoji(ev);
                        return (
                          <div key={idx} style={{ 
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            overflow: 'hidden',
                            flexShrink: 1
                          }}>
                            {idx > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', flexShrink: 0 }}>|</span>}
                            <span style={{ 
                              background: 'rgba(59, 130, 246, 0.2)', 
                              color: '#bfdbfe', 
                              padding: '3px 8px', 
                              borderRadius: '8px', 
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap'
                            }}>
                              <span style={{ flexShrink: 0 }}>{emoji}</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const schoolText = `${activeSchool.schoolName}${activeSchool.grade && activeSchool.grade !== 'all' ? ` (${activeSchool.grade}학년)` : ''}`;
                        const dateText = `${year}년 ${d.getMonth()+1}월 ${d.getDate()}일(${dayOfWeek})`;
                        const eventsText = dayEvents.join(', ');
                        const text = `[${schoolText}] ${dateText}\n일정: ${eventsText}`;
                        
                        if (navigator.share) {
                          navigator.share({
                            title: '학사일정 공유',
                            text: text
                          }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(text);
                          alert('일정이 클립보드에 복사되었습니다.');
                        }
                      }}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'var(--text-muted)', 
                        cursor: 'pointer', 
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                      title="이 날의 일정 공유하기"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"></circle>
                        <circle cx="6" cy="12" r="3"></circle>
                        <circle cx="18" cy="19" r="3"></circle>
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                      </svg>
                    </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!isLoading && !error && Object.keys(events).length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0', fontSize: '0.9rem' }}>
          이달에 등록된 학사일정이 없습니다.
        </div>
      )}
    </div>
  );
}
