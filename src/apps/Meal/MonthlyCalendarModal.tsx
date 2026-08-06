import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthlyCalendarModalProps {
  currentDate: Date;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

export function MonthlyCalendarModal({ currentDate, onClose, onSelectDate }: MonthlyCalendarModalProps) {
  const [displayDate, setDisplayDate] = React.useState(new Date(currentDate));

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startOffset = firstDay.getDay(); // Sunday start
  const daysInMonth = lastDay.getDate();

  const handlePrevMonth = () => {
    setDisplayDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(year, month, day);
    onSelectDate(newDate);
    onClose();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isSelected = (day: number) => {
    return currentDate.getFullYear() === year && currentDate.getMonth() === month && currentDate.getDate() === day;
  };

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '24px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '24px', borderRadius: '24px', background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <button onClick={handlePrevMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
            <ChevronLeft size={24} />
          </button>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{year}년 {month + 1}월</span>
          <button onClick={handleNextMonth} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const currentDayDate = new Date(year, month, day);
            const dayOfWeek = currentDayDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
            const today = isToday(day);
            const selected = isSelected(day);
            
            return (
              <div 
                key={day}
                onClick={isWeekend ? undefined : () => handleDayClick(day)}
                style={{
                  padding: '10px 0',
                  borderRadius: '12px',
                  background: selected && !isWeekend ? '#f43f5e' : (today && !isWeekend ? 'rgba(255,255,255,0.1)' : 'transparent'),
                  color: isWeekend ? 'rgba(255,255,255,0.2)' : (selected ? '#fff' : (today ? '#f43f5e' : '#fff')),
                  fontWeight: (selected || today) && !isWeekend ? 'bold' : 'normal',
                  cursor: isWeekend ? 'not-allowed' : 'pointer'
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
        
        <button 
          onClick={onClose}
          style={{
            marginTop: '32px', width: '100%', padding: '16px', borderRadius: '16px',
            background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: '1rem',
            cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
          }}
        >
          <X size={20} /> 닫기
        </button>
      </div>
    </div>
  );
}
