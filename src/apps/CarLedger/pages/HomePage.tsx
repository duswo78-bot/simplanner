import React from 'react';
import { useCarLedgerStore } from '../CarLedgerStore';
import { Car, Droplet, Wrench, Wallet, Activity, ArrowRight } from 'lucide-react';

interface HomePageProps {
  store: ReturnType<typeof useCarLedgerStore>;
  onNavigate?: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ store, onNavigate }) => {
  const stats = store.getMonthlyStats();
  const { reminders, aiInsights, recentActivities } = store;

  return (
    <div className="cl-page">
      <div className="cl-summary-scroll">
        <div className="cl-summary-card" style={{ backgroundColor: '#eff6ff' }}>
          <div className="cl-summary-card-label">이번 달 주행거리</div>
          <div className="cl-summary-card-value">
            {stats.mileage.toLocaleString()}
            <span className="cl-summary-card-unit">km</span>
          </div>
        </div>
        <div className="cl-summary-card" style={{ backgroundColor: '#f0fdf4' }}>
          <div className="cl-summary-card-label">이번 달 주유비</div>
          <div className="cl-summary-card-value">
            {stats.fuelCost.toLocaleString()}
            <span className="cl-summary-card-unit">원</span>
          </div>
        </div>
        <div className="cl-summary-card" style={{ backgroundColor: '#fffbeb' }}>
          <div className="cl-summary-card-label">이번 달 정비비</div>
          <div className="cl-summary-card-value">
            {stats.maintenanceCost.toLocaleString()}
            <span className="cl-summary-card-unit">원</span>
          </div>
        </div>
        <div className="cl-summary-card" style={{ backgroundColor: '#faf5ff' }}>
          <div className="cl-summary-card-label">총 차량 경비</div>
          <div className="cl-summary-card-value">
            {stats.totalExpenses.toLocaleString()}
            <span className="cl-summary-card-unit">원</span>
          </div>
        </div>
        <div className="cl-summary-card" style={{ backgroundColor: '#fff1f2' }}>
          <div className="cl-summary-card-label">평균 연비</div>
          <div className="cl-summary-card-value">
            {stats.avgEfficiency.toLocaleString()}
            <span className="cl-summary-card-unit">km/L</span>
          </div>
        </div>
      </div>

      <div className="cl-section-title">빠른 기록</div>
      <div className="cl-quick-actions">
        <button
          className="cl-quick-action-btn"
          onClick={() => onNavigate && onNavigate('drive')}
        >
          <div className="cl-quick-action-icon" style={{ backgroundColor: '#2563eb' }}>
            <Car size={20} />
          </div>
          <div className="cl-quick-action-label">주행 기록</div>
        </button>
        <button
          className="cl-quick-action-btn"
          onClick={() => onNavigate && onNavigate('fuel')}
        >
          <div className="cl-quick-action-icon" style={{ backgroundColor: '#16a34a' }}>
            <Droplet size={20} />
          </div>
          <div className="cl-quick-action-label">주유 기록</div>
        </button>
        <button
          className="cl-quick-action-btn"
          onClick={() => onNavigate && onNavigate('maintenance')}
        >
          <div className="cl-quick-action-icon" style={{ backgroundColor: '#d97706' }}>
            <Wrench size={20} />
          </div>
          <div className="cl-quick-action-label">정비</div>
        </button>
        <button
          className="cl-quick-action-btn"
          onClick={() => onNavigate && onNavigate('expense')}
        >
          <div className="cl-quick-action-icon" style={{ backgroundColor: '#7c3aed' }}>
            <Wallet size={20} />
          </div>
          <div className="cl-quick-action-label">경비</div>
        </button>
      </div>

      {reminders.length > 0 && (
        <>
          <div className="cl-section-title">알림</div>
          <div>
            {reminders.map((reminder) => {
              let icon = '🔔';
              if (reminder.type === 'insurance') icon = '🛡️';
              else if (reminder.type === 'inspection') icon = '🔍';
              else if (reminder.type === 'oil') icon = '🛢️';
              else if (reminder.type === 'maintenance') icon = '🔧';

              return (
                <div key={reminder.id} className={`cl-reminder-card ${reminder.severity}`}>
                  <div className={`cl-reminder-icon ${reminder.severity}`}>
                    {icon}
                  </div>
                  <div className="cl-reminder-text">
                    <div className="cl-reminder-vehicle">{reminder.vehicleName}</div>
                    <div className="cl-reminder-msg">{reminder.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {aiInsights.length > 0 && (
        <>
          <div className="cl-section-title">AI 리포트</div>
          <div>
            {aiInsights.map((insight) => (
              <div key={insight.id} className="cl-insight-card">
                <div className="cl-insight-emoji">{insight.icon}</div>
                <div className="cl-insight-body">
                  <div className="cl-insight-title">{insight.title}</div>
                  <div className="cl-insight-msg">{insight.message}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="cl-section-title">최근 내역</div>
      <div className="cl-activity-list">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity) => (
            <div key={activity.id} className="cl-activity-item">
              <div className={`cl-activity-dot ${activity.type}`} />
              <div className="cl-activity-info">
                <div className="cl-activity-summary">{activity.summary}</div>
                <div className="cl-activity-date">{activity.date}</div>
              </div>
              <div className="cl-activity-amount">{activity.detail}</div>
            </div>
          ))
        ) : (
          <div className="cl-empty" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
            최근 내역이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
