import React, { useState, useMemo } from 'react';
import { useCarLedgerStore } from '../CarLedgerStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ store }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const yearMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  
  const events = useMemo(() => store.getCalendarEvents(yearMonth), [store, yearMonth]);
  
  const changeMonth = (offset: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      const today = new Date();
      if (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() === today.getMonth()) {
        setSelectedDateStr(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      } else {
        setSelectedDateStr(`${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}-01`);
      }
      return newDate;
    });
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const days = [];
  
  // Previous month days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    const m = currentMonth === 0 ? 12 : currentMonth;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    days.push({
      dateStr,
      day: d,
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    days.push({
      dateStr,
      day: i,
      isCurrentMonth: true,
    });
  }
  
  // Next month days to fill grid (42 cells total)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    const m = currentMonth === 11 ? 1 : currentMonth + 2;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    days.push({
      dateStr,
      day: i,
      isCurrentMonth: false,
    });
  }

  const selectedDayEvents = events.filter(e => e.date === selectedDateStr);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="cl-page">
      <div className="cl-calendar">
        <div className="cl-calendar-nav">
          <button className="cl-icon-btn" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="cl-calendar-title">
            {currentYear}년 {currentMonth + 1}월
          </div>
          <button className="cl-icon-btn" onClick={() => changeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="cl-calendar-grid">
          {dayLabels.map(label => (
            <div key={label} className="cl-calendar-day-label">{label}</div>
          ))}

          {days.map((d, idx) => {
            const dayEvents = events.filter(e => e.date === d.dateStr);
            const uniqueTypes = Array.from(new Set(dayEvents.map(e => e.type)));
            
            let classNames = "cl-calendar-day";
            if (!d.isCurrentMonth) classNames += " other-month";
            if (d.dateStr === todayStr) classNames += " today";
            if (d.dateStr === selectedDateStr) classNames += " selected";

            return (
              <button 
                key={idx} 
                className={classNames}
                onClick={() => {
                  if (!d.isCurrentMonth) {
                    const diff = d.day > 15 ? -1 : 1;
                    changeMonth(diff);
                  }
                  setSelectedDateStr(d.dateStr);
                }}
              >
                <span className="cl-calendar-date">{d.day}</span>
                <div className="cl-calendar-dots">
                  {uniqueTypes.slice(0, 4).map((type, i) => (
                    <div key={i} className={`cl-calendar-event-dot ${type}`}></div>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="cl-calendar-events">
        {selectedDayEvents.length === 0 ? (
          <div className="cl-empty" style={{ padding: '20px' }}>
            <p>이 날의 기록이 없습니다</p>
          </div>
        ) : (
          selectedDayEvents.map(e => (
            <div key={e.id} className="cl-calendar-event-item">
              <div className={`cl-calendar-event-badge ${e.type}`}></div>
              <div className="cl-calendar-event-text">{e.summary}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
