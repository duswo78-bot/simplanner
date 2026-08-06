import React from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import './TopWidget.css';

export function TopWidget() {
  return (
    <div className="top-widget glass-panel animate-fade-in">
      <div className="widget-header">
        <h2>SimPlanner</h2>
        <p className="subtitle">일정을 넘어 가족을 관리하다</p>
      </div>
      
      <div className="widget-stats">
        <div className="stat-item">
          <div className="icon-wrapper bg-blue">
            <Calendar size={20} color="#fff" />
          </div>
          <div className="stat-text">
            <span className="stat-label">오늘 일정</span>
            <span className="stat-value">3건</span>
          </div>
        </div>
        
        <div className="divider"></div>
        
        <div className="stat-item">
          <div className="icon-wrapper bg-green">
            <CheckCircle2 size={20} color="#fff" />
          </div>
          <div className="stat-text">
            <span className="stat-label">해야 할 일</span>
            <span className="stat-value">5건</span>
          </div>
        </div>
      </div>
    </div>
  );
}
