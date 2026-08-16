import React from 'react';
import { useParcelStore } from '../ParcelStore';

interface SettingsPageProps {
  store: ReturnType<typeof useParcelStore>;
}

export function SettingsPage({ store }: SettingsPageProps) {
  return (
    <div className="pc-page">
      <div className="pc-section">
        <h2 className="pc-section-title">설정</h2>
        <div className="pc-settings-list">
          <div 
            className="pc-settings-item" 
            onClick={() => store.setDarkMode(!store.isDarkMode)}
          >
            <span>다크 모드</span>
            <div className={`pc-toggle ${store.isDarkMode ? 'on' : ''}`}>
              <div className="pc-toggle-knob" />
            </div>
          </div>
          
          <button 
            className="pc-settings-item" 
            onClick={() => {
              if (window.confirm('모든 조회 이력을 삭제하시겠습니까?')) {
                store.clearHistory();
              }
            }}
          >
            <span style={{ color: '#ef4444' }}>조회 이력 전체 삭제</span>
          </button>
          
          <button 
            className="pc-settings-item" 
            onClick={() => alert('준비 중입니다.')}
          >
            <span>데이터 백업</span>
          </button>
          
          <button 
            className="pc-settings-item" 
            onClick={() => alert('준비 중입니다.')}
          >
            <span>데이터 복원</span>
          </button>
          
          <div 
            className="pc-settings-item" 
            onClick={() => alert('준비 중입니다.')}
          >
            <span>배송완료 자동 정리</span>
            <div className="pc-toggle">
              <div className="pc-toggle-knob" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
