import React, { useState } from 'react';
import { Calendar, CheckCircle2, X, Bell } from 'lucide-react';
import { useSchedule, isEventOccurringOnDate } from '../apps/shared/ScheduleContext';
import type { AppNotification } from './NotificationManager';
import './TopWidget.css';

interface TopWidgetProps {
  notifications?: AppNotification[];
}

export function TopWidget({ notifications = [] }: TopWidgetProps) {
  const { events } = useSchedule();
  const [popupType, setPopupType] = useState<'none' | 'schedule' | 'todo' | 'notification'>('none');
  const [weather, setWeather] = useState<{ temp: number, desc: string, pop: number } | null>(null);

  useEffect(() => {
    // Seoul coordinates for Open-Meteo
    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.566&longitude=126.978&current=temperature_2m,weather_code&daily=precipitation_probability_max&timezone=Asia%2FSeoul')
      .then(res => res.json())
      .then(data => {
        const code = data.current?.weather_code || 0;
        let desc = '맑음';
        if (code >= 1 && code <= 3) desc = '구름조금';
        if (code >= 45 && code <= 48) desc = '안개';
        if (code >= 51 && code <= 67) desc = '비';
        if (code >= 71 && code <= 77) desc = '눈';
        if (code >= 80 && code <= 82) desc = '소나기';
        if (code >= 95) desc = '뇌우';

        setWeather({
          temp: data.current?.temperature_2m || 0,
          desc,
          pop: data.daily?.precipitation_probability_max?.[0] || 0
        });
      })
      .catch(err => console.error('Weather fetch error:', err));
  }, []);

  const today = new Date();
  
  const todaysEvents = events.filter(e => !e.isTodo && isEventOccurringOnDate(e, today));
  const todaysTodos = events.filter(e => e.isTodo && isEventOccurringOnDate(e, today));

  return (
    <>
      <div className="top-widget glass-panel animate-fade-in">
        <div className="widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src={`${import.meta.env.BASE_URL}icon.png`}
              alt="logo" 
              style={{ width: 44, height: 44, borderRadius: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
            />
            <h2 style={{ margin: 0 }}>Simplanner</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '8px' }}>
            <p className="subtitle" style={{ margin: 0 }}>일정을 넘어<br/>가족을 관리하다</p>
            {weather && (
              <div style={{ 
                background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '12px', 
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.85rem' 
              }}>
                <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                  {weather.desc === '맑음' ? '☀️' : weather.desc.includes('비') ? '🌧️' : weather.desc.includes('구름') ? '⛅' : '☁️'} {weather.temp}°C
                </div>
                <div style={{ color: '#e2e8f0', fontSize: '0.75rem', marginTop: '2px' }}>
                  {weather.desc} · 강수 {weather.pop}%
                </div>
              </div>
            )}
          </div>
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
              {notifications.some(n => !n.isRead) && (
                <div className="notification-dot active" style={{ position: 'absolute', top: 4, right: 4 }} />
              )}
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
