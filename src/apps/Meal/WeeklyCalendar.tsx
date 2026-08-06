import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface WeeklyCalendarProps {
  currentDate: Date; // The active selected date
  onDateSelect: (date: Date) => void;
  onOpenMonthly: () => void;
}

export function WeeklyCalendar({ currentDate, onDateSelect, onOpenMonthly }: WeeklyCalendarProps) {
  // Calculate the start of the week (Sunday)
  const getSunday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day; // day 0 is Sunday
    return new Date(date.setDate(diff));
  };

  const sunday = getSunday(currentDate);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });

  const handlePrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateSelect(d);
  };

  const handleNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateSelect(d);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isToday = (d: Date) => isSameDay(d, new Date());
  
  const yearStr = sunday.getFullYear();
  const monthStr = `${sunday.getMonth() + 1}월`;

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={handlePrevWeek} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={onOpenMonthly} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', 
            border: 'none', color: '#fff', cursor: 'pointer', padding: '6px 12px', borderRadius: '16px',
            fontWeight: 'bold', fontSize: '1.1rem'
          }}
        >
          {yearStr}년 {monthStr} <CalendarIcon size={18} />
        </button>
        <button onClick={handleNextWeek} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px' }}>
          <ChevronRight size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {weekDays.map((date, idx) => {
          const active = isSameDay(date, currentDate);
          const today = isToday(date);
          const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
          const dayName = dayNames[idx];

          const isWeekend = idx === 0 || idx === 6;

          return (
            <div 
              key={idx} 
              onClick={isWeekend ? undefined : () => onDateSelect(date)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: isWeekend ? 'not-allowed' : 'pointer',
                padding: '8px 4px',
                borderRadius: '12px',
                background: active && !isWeekend ? '#f43f5e' : 'transparent',
                color: isWeekend ? 'rgba(255,255,255,0.2)' : (active ? '#fff' : 'rgba(255,255,255,0.7)'),
                minWidth: '36px'
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>{dayName}</span>
              <span style={{ 
                fontSize: '1rem', 
                fontWeight: active || today ? 'bold' : 'normal',
                color: today && !active && !isWeekend ? '#f43f5e' : 'inherit'
              }}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
