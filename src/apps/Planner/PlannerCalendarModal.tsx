import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalIcon, MapPin, Check, Repeat } from 'lucide-react';
import { useSchedule, isEventOccurringOnDate, getYYYYMMDD } from '../shared/ScheduleContext';
import type { ScheduleEvent } from '../shared/ScheduleContext';

interface PlannerCalendarModalProps {
  onClose: () => void;
  toggleEventCompletion: (id: string, dateStr: string) => void;
}

export function PlannerCalendarModal({ onClose, toggleEventCompletion }: PlannerCalendarModalProps) {
  const { events } = useSchedule();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const todayStr = getYYYYMMDD(new Date());

  // Helper to render event chips in the calendar cell
  const renderEventChips = (date: Date) => {
    const dayEvents = events.filter(e => isEventOccurringOnDate(e, date));
    if (dayEvents.length === 0) return null;

    const displayEvents = dayEvents.slice(0, 2);
    const hiddenCount = dayEvents.length - 2;

    return (
      <div className="cal-cell-events">
        {displayEvents.map(e => {
          const text = e.what.length > 5 ? e.what.substring(0, 5) + '..' : e.what;
          return (
            <div key={e.id} className={`cal-chip ${e.isTodo ? 'todo-chip' : 'event-chip'}`} title={e.what}>
              {text}
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div className="cal-chip more-chip">+{hiddenCount}</div>
        )}
      </div>
    );
  };

  // Render Daily Detail Modal inside the Calendar Modal
  const renderDailyDetail = () => {
    if (!selectedDate) return null;

    const dateStr = getYYYYMMDD(selectedDate);
    const dayEvents = events.filter(e => isEventOccurringOnDate(e, selectedDate));
    const todos = dayEvents.filter(e => e.isTodo);
    const schedules = dayEvents.filter(e => !e.isTodo);

    const isTodoCompleted = (event: ScheduleEvent) => {
      return event.completedDates?.includes(dateStr) || event.completed;
    };

    return (
      <div className="daily-detail-modal">
        <div className="daily-detail-content">
          <div className="modal-header" style={{ marginBottom: '16px', borderBottom: 'none' }}>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 상세 일정
            </h3>
            <button className="icon-btn" onClick={() => setSelectedDate(null)}>
              <X size={24} color="#44403c" />
            </button>
          </div>
          
          <div className="daily-detail-scroll">
            <h4 className="detail-section-title">일정</h4>
            <div className="schedule-list">
              {schedules.map((event, idx) => {
                const d = new Date(event.when);
                const hour = d.getHours();
                const min = d.getMinutes().toString().padStart(2, '0');
                return (
                  <div key={event.id} className="schedule-item">
                    <div className="schedule-time">
                      <span>{hour.toString().padStart(2, '0')}:{min}</span>
                    </div>
                    <div className={`schedule-dot color-${(idx % 5) + 1}`} style={{ backgroundColor: `var(--color-${(idx%5)+1}, #3b82f6)` }} />
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
                  </div>
                );
              })}
              {schedules.length === 0 && <div className="empty-text">일정이 없습니다.</div>}
            </div>

            <h4 className="detail-section-title" style={{ marginTop: '24px' }}>할일</h4>
            <div className="todo-list-compact">
              {todos.map(todo => {
                const isCompleted = isTodoCompleted(todo);
                return (
                  <div key={todo.id} className={`todo-item-compact ${isCompleted ? 'checked' : ''}`}>
                    <div className={`todo-checkbox-square ${isCompleted ? 'checked' : ''}`} onClick={() => toggleEventCompletion(todo.id, dateStr)}>
                      {isCompleted && <Check size={14} color="white" />}
                    </div>
                    <span>
                      {todo.recurrence && todo.recurrence !== 'none' && <Repeat size={12} color="#57534e" style={{ marginRight: 4, display: 'inline' }} />}
                      {todo.what}
                    </span>
                  </div>
                );
              })}
              {todos.length === 0 && <div className="empty-text">할일이 없습니다.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="calendar-modal full-calendar" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #e7e5e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="icon-btn" onClick={handlePrevMonth}><ChevronLeft size={20}/></button>
            <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalIcon size={20} color="#fb923c" />
              {year}년 {month + 1}월
            </h3>
            <button className="icon-btn" onClick={handleNextMonth}><ChevronRight size={20}/></button>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={24} color="#44403c" />
          </button>
        </div>
        
        <div className="calendar-grid-container">
          <div className="calendar-weekdays">
            <div className="weekday sunday">일</div>
            <div className="weekday">월</div>
            <div className="weekday">화</div>
            <div className="weekday">수</div>
            <div className="weekday">목</div>
            <div className="weekday">금</div>
            <div className="weekday saturday">토</div>
          </div>
          
          <div className="calendar-grid-full">
            {days.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="cal-cell empty" />;
              const isToday = getYYYYMMDD(date) === todayStr;
              const isSunday = date.getDay() === 0;
              const isSaturday = date.getDay() === 6;
              
              return (
                <div 
                  key={index} 
                  className={`cal-cell ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className={`cal-date-num ${isSunday ? 'sunday' : ''} ${isSaturday ? 'saturday' : ''}`}>
                    {date.getDate()}
                  </div>
                  {renderEventChips(date)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {renderDailyDetail()}
    </div>
  );
}
