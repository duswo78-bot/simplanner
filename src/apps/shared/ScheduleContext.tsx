import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TodoStatus = 'todo' | 'in_progress' | 'done';
export type RecurrenceType = string; // e.g., 'none', 'daily:1', 'weekly:2'

export interface ScheduleEvent {
  id: string;
  what: string;
  when: string; // ISO date string
  where?: string;
  isTodo?: boolean;
  completed?: boolean; // Keep for backward compatibility or simple UI
  status?: TodoStatus;
  
  recurrence?: RecurrenceType;
  completedDates?: string[]; // Array of YYYY-MM-DD strings for recurring todo completion
}

export interface Memo {
  id: string;
  content: string;
  tag?: string;
  createdAt: string;
}

export const isEventOccurringOnDate = (event: ScheduleEvent, targetDate: Date) => {
  const eventDate = new Date(event.when);
  eventDate.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() < eventDate.getTime()) return false;

  if (!event.recurrence || event.recurrence === 'none') {
    return target.getTime() === eventDate.getTime();
  }

  const diffTime = target.getTime() - eventDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const [baseType, intervalStr] = event.recurrence.split(':');
  const interval = intervalStr ? parseInt(intervalStr, 10) : 1;

  switch (baseType) {
    case 'daily': return diffDays % interval === 0;
    case 'weekly': return diffDays % (7 * interval) === 0;
    case 'monthly': return (target.getMonth() - eventDate.getMonth() + (target.getFullYear() - eventDate.getFullYear()) * 12) % interval === 0 && target.getDate() === eventDate.getDate();
    case 'yearly': return target.getDate() === eventDate.getDate() && target.getMonth() === eventDate.getMonth() && (target.getFullYear() - eventDate.getFullYear()) % interval === 0;
    case 'freq': return false; // Handled differently (by checklist/goals), don't show specific days automatically unless advanced logic
    default: return false;
  }
};

export const getYYYYMMDD = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

interface ScheduleContextType {
  events: ScheduleEvent[];
  addEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  removeEvent: (id: string) => void;
  toggleEventCompletion: (id: string, targetDateStr?: string) => void;
  updateEventStatus: (id: string, status: TodoStatus) => void;
  
  memos: Memo[];
  addMemo: (memo: Omit<Memo, 'id' | 'createdAt'>) => void;
  removeMemo: (id: string) => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);

  useEffect(() => {
    const savedEvents = localStorage.getItem('simplanner_events');
    const savedMemos = localStorage.getItem('simplanner_memos');
    if (savedEvents) {
      try { setEvents(JSON.parse(savedEvents)); } catch (e) {}
    }
    if (savedMemos) {
      try { setMemos(JSON.parse(savedMemos)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('simplanner_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('simplanner_memos', JSON.stringify(memos));
  }, [memos]);

  const addEvent = (event: Omit<ScheduleEvent, 'id'>) => {
    const newEvent: ScheduleEvent = {
      ...event,
      status: event.status || 'todo',
      recurrence: event.recurrence || 'none',
      completedDates: event.completedDates || [],
      id: Date.now().toString() + Math.random().toString(36).substring(7),
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const toggleEventCompletion = (id: string, targetDateStr?: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          if (e.recurrence && e.recurrence !== 'none' && targetDateStr) {
            // Recurring event logic
            const dates = e.completedDates || [];
            if (dates.includes(targetDateStr)) {
              return { ...e, completedDates: dates.filter(d => d !== targetDateStr) };
            } else {
              return { ...e, completedDates: [...dates, targetDateStr] };
            }
          } else {
            // Non-recurring logic
            const newCompleted = !e.completed;
            return { ...e, completed: newCompleted, status: newCompleted ? 'done' : 'todo' };
          }
        }
        return e;
      })
    );
  };

  const updateEventStatus = (id: string, status: TodoStatus) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status, completed: status === 'done' } : e
      )
    );
  };

  const addMemo = (memo: Omit<Memo, 'id' | 'createdAt'>) => {
    const newMemo: Memo = {
      ...memo,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      createdAt: new Date().toISOString(),
    };
    setMemos(prev => [newMemo, ...prev]);
  };

  const removeMemo = (id: string) => {
    setMemos(prev => prev.filter(m => m.id !== id));
  };

  return (
    <ScheduleContext.Provider value={{ events, addEvent, removeEvent, toggleEventCompletion, updateEventStatus, memos, addMemo, removeMemo }}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
