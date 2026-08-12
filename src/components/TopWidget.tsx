import React, { useState } from 'react';
import { Calendar, CheckCircle2, X, Bell } from 'lucide-react';
import { useSchedule, isEventOccurringOnDate } from '../apps/shared/ScheduleContext';
import './TopWidget.css';

export function TopWidget() {
  const { events } = useSchedule();
  const [popupType, setPopupType] = useState<'none' | 'schedule' | 'todo' | 'notification'>('none');

  const today = new Date();
  
  const todaysEvents = events.filter(e => !e.isTodo && isEventOccurringOnDate(e, today));
  const todaysTodos = events.filter(e => e.isTodo && isEventOccurringOnDate(e, today));

  // Placeholder for notifications (package delivery, school events, etc.)
  const notifications = [
    { id: 'n1', text: '오늘 오후 우체국 택배 도착 예정' },
  ];

  return (
    <>
      <div className="top-widget glass-panel animate-fade-in">
        <div className="widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="/icon.png" 
              alt="logo" 
              style={{ width: 44, height: 44, borderRadius: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <h2 style={{ margin: 0 }}>Simplanner</h2>
          </div>
          <p className="subtitle" style={{ marginTop: '8px' }}>일정을 넘어<br/>가족을 관리하다</p>
        </div>
        
        <div className="widget-stats">
          <div className="stat-item clickable-stat" onClick={() => setPopupType('schedule')}>
            <div className="icon-wrapper bg-blue">
              <Calendar size={18} color="#fff" />
            </div>
            <div className="stat-text">
              <span className="stat-label">일정</span>
              <span className="stat-value">{todaysEvents.length}건</span>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="stat-item clickable-stat" onClick={() => setPopupType('todo')}>
            <div className="icon-wrapper bg-green">
              <CheckCircle2 size={18} color="#fff" />
            </div>
            <div className="stat-text">
              <span className="stat-label">할일</span>
              <span className="stat-value">{todaysTodos.length}건</span>
            </div>
          </div>

          <div className="divider"></div>
          
          <div className="stat-item clickable-stat" onClick={() => setPopupType('notification')} style={{ position: 'relative' }}>
            <div className="icon-wrapper bg-orange">
              <Bell size={18} color="white" />
              <div className={`notification-dot ${notifications.some(n => !n.isRead) ? 'active' : ''}`} style={{ position: 'absolute', top: 4, right: 4 }} />
            </div>
            <div className="stat-text">
              <span className="stat-label">알림</span>
              <span className="stat-value">{notifications.length}건</span>
            </div>
          </div>
        </div>
      </div>

      {popupType !== 'none' && (
        <div className="widget-popup-overlay" onClick={() => setPopupType('none')}>
          <div className="widget-popup-content" onClick={e => e.stopPropagation()}>
            <div className="widget-popup-header">
              <h3>
                {popupType === 'schedule' ? '오늘의 일정' : 
                 popupType === 'todo' ? '오늘의 할일' : '알림 목록'}
              </h3>
              <button className="icon-btn" onClick={() => setPopupType('none')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="widget-popup-body">
              {popupType === 'schedule' && (
                <>
                  {todaysEvents.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#475569', margin: '0' }}>
                      {todaysEvents.map(e => <li key={e.id} style={{ marginBottom: '8px' }}>{e.what}</li>)}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>일정이 없습니다.</p>
                  )}
                </>
              )}

              {popupType === 'todo' && (
                <>
                  {todaysTodos.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#475569', margin: '0' }}>
                      {todaysTodos.map(e => (
                        <li key={e.id} style={{ textDecoration: e.completed ? 'line-through' : 'none', color: e.completed ? '#cbd5e1' : '#475569', marginBottom: '8px' }}>
                          {e.what}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>할일이 없습니다.</p>
                  )}
                </>
              )}

              {popupType === 'notification' && (
                <>
                  {notifications.length > 0 ? (
                    <ul style={{ paddingLeft: '20px', color: '#475569', margin: '0' }}>
                      {notifications.map(n => (
                        <li key={n.id} style={{ marginBottom: '8px' }}>{n.text}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>새로운 알림이 없습니다.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
