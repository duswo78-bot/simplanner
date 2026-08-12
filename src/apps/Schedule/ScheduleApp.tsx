import React, { useState, useMemo } from 'react';
import { ArrowLeft, Share, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useSchedule, ScheduleEvent } from '../shared/ScheduleContext';
import './ScheduleApp.css';

interface ScheduleAppProps {
  onBack: () => void;
}

export function ScheduleApp({ onBack }: ScheduleAppProps) {
  const { events, addEvent } = useSchedule();
  const [inputText, setInputText] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const parseInput = (text: string) => {
    let where = '';
    let whenStr = '';
    let what = text;

    const whereMatch = text.match(/(\S+)에서\s/);
    if (whereMatch) {
      where = whereMatch[1];
      what = what.replace(whereMatch[0], '');
    }

    const today = new Date();
    let targetDate = new Date(currentDate); 
    // Default to the currently selected date in the calendar, unless specified

    if (text.includes('내일')) {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
      whenStr = '내일';
      what = what.replace('내일', '').trim();
    } else if (text.includes('모레')) {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 2);
      whenStr = '모레';
      what = what.replace('모레', '').trim();
    } else if (text.includes('오늘')) {
      targetDate = new Date(today);
      whenStr = '오늘';
      what = what.replace('오늘', '').trim();
    }

    const timeMatch = text.match(/오전\s?(\d+)시|오후\s?(\d+)시|(\d+)시/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1] || timeMatch[2] || timeMatch[3], 10);
      const isPm = text.includes('오후');
      const finalHour = isPm ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
      targetDate.setHours(finalHour, 0, 0, 0);
      what = what.replace(timeMatch[0], '').trim();
    } else {
      // Default to 9 AM if no time specified, for timeline visibility
      targetDate.setHours(9, 0, 0, 0);
    }

    return { what: what.trim(), where, when: targetDate.toISOString() };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const parsed = parseInput(inputText);
    if (!parsed.what) {
      alert("무엇을 할지 입력해주세요.");
      return;
    }

    addEvent({
      what: parsed.what,
      when: parsed.when,
      where: parsed.where,
      isTodo: false,
    });
    setInputText('');
  };

  const generateICS = (event: ScheduleEvent) => {
    const d = new Date(event.when);
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    const start = formatDate(d);
    const endObj = new Date(d);
    endObj.setHours(endObj.getHours() + 1);
    const end = formatDate(endObj);

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.what}`,
      event.where ? `LOCATION:${event.where}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
  };

  const shareEvent = async (event: ScheduleEvent) => {
    const icsContent = generateICS(event);
    const file = new File([icsContent], 'event.ics', { type: 'text/calendar' });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: event.what,
          text: '일정을 공유합니다.',
          files: [file]
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Weekly Calendar Logic
  const generateWeekDays = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Adjust to Sunday
    const sunday = new Date(d.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(sunday);
      current.setDate(sunday.getDate() + i);
      week.push(current);
    }
    return week;
  };

  const weekDays = generateWeekDays(currentDate);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  // Timeline Logic
  const timelineHours = Array.from({ length: 24 }, (_, i) => i);
  const currentDayEvents = events.filter(e => {
    if (e.isTodo) return false;
    const ed = new Date(e.when);
    return ed.getDate() === currentDate.getDate() && ed.getMonth() === currentDate.getMonth() && ed.getFullYear() === currentDate.getFullYear();
  });

  return (
    <div className="schedule-app app-container animate-fade-in">
      <div className="app-header glass-panel">
        <button className="icon-btn" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h2>일정</h2>
        <div className="header-actions">
          <CalendarIcon size={24} />
        </div>
      </div>

      <div className="app-content">
        <form className="schedule-input-form" onSubmit={handleAdd}>
          <textarea
            placeholder="예: 내일 오후 3시 강남역에서 미팅"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="schedule-textarea"
            rows={2}
          />
          <button type="submit" className="add-btn"><Plus size={20} /></button>
        </form>
        <p className="hint-text">언제, 어디서, 무엇을 적어주시면 자동으로 분석해요!</p>

        {/* Weekly Mini Calendar */}
        <div className="weekly-calendar-container">
          <div className="calendar-header">
            <button onClick={prevWeek}>&lt;</button>
            <h3>{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</h3>
            <button onClick={nextWeek}>&gt;</button>
          </div>
          <div className="calendar-grid">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
            {weekDays.map((dayDate, index) => {
              const day = dayDate.getDate();
              const isToday = dayDate.toDateString() === new Date().toDateString();
              const isSelected = dayDate.toDateString() === currentDate.toDateString();
              
              const dayEvents = events.filter(e => {
                if (e.isTodo) return false;
                const ed = new Date(e.when);
                return ed.getDate() === day && ed.getMonth() === dayDate.getMonth() && ed.getFullYear() === dayDate.getFullYear();
              });

              return (
                <div 
                  key={index} 
                  className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  onClick={() => setCurrentDate(new Date(dayDate))}
                >
                  <span className="day-number">{day}</span>
                  {dayEvents.length > 0 && <div className="event-dot" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline View */}
        <div className="timeline-container">
          <h3 className="timeline-title">{currentDate.getDate()}일 일정</h3>
          <div className="timeline-scroll">
            {timelineHours.map(hour => {
              const hourEvents = currentDayEvents.filter(e => new Date(e.when).getHours() === hour);
              
              return (
                <div key={hour} className="timeline-row">
                  <div className="timeline-time">
                    {hour === 0 ? '오전 12시' : hour < 12 ? `오전 ${hour}시` : hour === 12 ? '오후 12시' : `오후 ${hour - 12}시`}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-divider" />
                    {hourEvents.map(event => (
                      <div key={event.id} className="timeline-event-card">
                        <div className="event-info">
                          <h4>{event.what}</h4>
                          {event.where && <p className="where-text">📍 {event.where}</p>}
                        </div>
                        <button className="icon-btn share-btn" onClick={() => shareEvent(event)}>
                          <Share size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {currentDayEvents.length === 0 && (
              <div className="timeline-empty-state">
                예정된 일정이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
