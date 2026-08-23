import React, { useRef, useState } from 'react';
import { ChevronLeft, MonitorSmartphone, MapPin, Bell, Database, Info, Download, Upload, Trash2, Search } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { INITIAL_APPS } from '../../components/Launcher';
import './SettingsApp.css';

interface SettingsAppProps {
  onBack: () => void;
}

export function SettingsApp({ onBack }: SettingsAppProps) {
  const { settings, updateSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [locInput, setLocInput] = useState(settings.fixedLocation.city);
  const [isSearching, setIsSearching] = useState(false);

  const handleToggleApp = (appId: string) => {
    const isHidden = settings.hiddenApps.includes(appId);
    if (isHidden) {
      updateSettings({ hiddenApps: settings.hiddenApps.filter(id => id !== appId) });
    } else {
      updateSettings({ hiddenApps: [...settings.hiddenApps, appId] });
    }
  };

  const handleSearchLocation = async () => {
    if (!locInput.trim()) return;
    setIsSearching(true);
    try {
      const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;
      const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
      const res = await fetch(`${baseUrl}/v2/local/search/address.json?query=${encodeURIComponent(locInput)}`, {
        headers: { 'Authorization': `KakaoAK ${KAKAO_API_KEY}` }
      });
      const data = await res.json();
      if (data.documents && data.documents.length > 0) {
        const doc = data.documents[0];
        const newLoc = {
          lat: parseFloat(doc.y),
          lng: parseFloat(doc.x),
          city: doc.address_name
        };
        updateSettings({ fixedLocation: newLoc });
        setLocInput(doc.address_name);
        alert(`위치가 '${doc.address_name}'(으)로 설정되었습니다.`);
      } else {
        alert('주소를 찾을 수 없습니다.');
      }
    } catch (e) {
      alert('위치 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportData = () => {
    try {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simplanner_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('백업 중 오류가 발생했습니다.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (typeof data !== 'object') throw new Error('Invalid format');
        
        if (window.confirm('기존 데이터가 모두 덮어쓰기됩니다. 진행하시겠습니까?')) {
          localStorage.clear();
          Object.keys(data).forEach(key => {
            localStorage.setItem(key, data[key]);
          });
          alert('복원이 완료되었습니다. 앱이 재시작됩니다.');
          window.location.reload();
        }
      } catch (e) {
        alert('올바른 백업 파일이 아닙니다.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('모든 설정 및 저장된 데이터가 영구적으로 삭제됩니다. 정말 초기화하시겠습니까?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="settings-app animate-fade-in">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={28} color="#fff" />
        </button>
        <h2>설정</h2>
        <div style={{ minWidth: 44 }}></div>
      </div>

      <div className="settings-content">
        {/* 디스플레이 및 홈 */}
        <div className="settings-section">
          <div className="settings-section-title">디스플레이 및 홈</div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <MonitorSmartphone size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">홈 화면 앱 표시</div>
                <div className="settings-item-desc">사용하지 않는 앱을 홈 화면에서 숨길 수 있습니다.</div>
              </div>
            </div>
            <div className="app-toggle-grid">
              {INITIAL_APPS.map(app => {
                if (app.id === 'app-settings') return null; // Hide settings from toggle
                const isHidden = settings.hiddenApps.includes(app.id);
                const Icon = app.icon ? (LucideIcons[app.icon as keyof typeof LucideIcons] as React.FC<any>) : null;
                return (
                  <div 
                    key={app.id} 
                    className={`app-toggle-item clickable ${isHidden ? 'hidden' : ''}`}
                    onClick={() => handleToggleApp(app.id)}
                  >
                    <div className="app-toggle-icon-wrap" style={{ background: isHidden ? '#334155' : (app.color || '#334155') }}>
                      {Icon && <Icon size={24} />}
                    </div>
                    <div className="app-toggle-name">{app.name}</div>
                    <div className={`tiny-switch ${!isHidden ? 'on' : ''}`}></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 위치 및 날씨 */}
        <div className="settings-section">
          <div className="settings-section-title">위치 및 날씨</div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <MapPin size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">위치 설정 방식</div>
                <div className="settings-item-desc">고정 위치를 사용하면 GPS 탐색 없이 빠르게 로딩됩니다.</div>
              </div>
              <div className="settings-item-action">
                <select 
                  className="settings-input" 
                  style={{ width: 'auto', padding: '6px 10px' }}
                  value={settings.locationMode}
                  onChange={(e) => updateSettings({ locationMode: e.target.value as 'gps' | 'fixed' })}
                >
                  <option value="gps">GPS 자동 수신</option>
                  <option value="fixed">고정 위치 사용</option>
                </select>
              </div>
            </div>
            
            {settings.locationMode === 'fixed' && (
              <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', paddingLeft: '66px' }}>
                <div className="settings-item-desc">현재 고정된 위치: <strong>{settings.fixedLocation.city}</strong></div>
                <div className="settings-input-group">
                  <input 
                    type="text" 
                    className="settings-input" 
                    placeholder="동(읍/면) 이름 검색 (예: 서초동)"
                    value={locInput}
                    onChange={(e) => setLocInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
                  />
                  <button className="settings-btn" onClick={handleSearchLocation} disabled={isSearching}>
                    {isSearching ? '검색중' : <Search size={16} style={{ verticalAlign: 'middle' }} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 알림 및 사운드 */}
        <div className="settings-section">
          <div className="settings-section-title">알림 및 사운드</div>
          <div className="settings-card">
            <div className="settings-item">
              <div className="settings-item-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <Bell size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">푸시 알림 수신</div>
                <div className="settings-item-desc">일정 및 중요 알림을 받습니다.</div>
              </div>
              <div className="settings-item-action">
                <input 
                  type="checkbox" 
                  className="toggle-switch"
                  checked={settings.notifications}
                  onChange={(e) => updateSettings({ notifications: e.target.checked })}
                />
              </div>
            </div>
            <div className="settings-item">
              <div className="settings-item-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
                <Info size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">사운드 효과</div>
                <div className="settings-item-desc">앱 내 사운드 효과를 재생합니다.</div>
              </div>
              <div className="settings-item-action">
                <input 
                  type="checkbox" 
                  className="toggle-switch"
                  checked={settings.sounds}
                  onChange={(e) => updateSettings({ sounds: e.target.checked })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 관리 */}
        <div className="settings-section">
          <div className="settings-section-title">데이터 관리</div>
          <div className="settings-card">
            <div className="settings-item clickable" onClick={handleExportData}>
              <div className="settings-item-icon" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <Download size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">데이터 백업</div>
                <div className="settings-item-desc">모든 데이터를 파일로 저장합니다.</div>
              </div>
            </div>
            <div className="settings-item clickable" onClick={() => fileInputRef.current?.click()}>
              <div className="settings-item-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <Upload size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title">데이터 복원</div>
                <div className="settings-item-desc">백업 파일을 불러와 복구합니다.</div>
              </div>
              <input type="file" accept=".json" className="file-input-hidden" ref={fileInputRef} onChange={handleImportData} />
            </div>
            <div className="settings-item clickable" onClick={handleClearData}>
              <div className="settings-item-icon" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e' }}>
                <Trash2 size={18} />
              </div>
              <div className="settings-item-content">
                <div className="settings-item-title" style={{ color: '#f43f5e' }}>모든 데이터 초기화</div>
                <div className="settings-item-desc">기기의 모든 데이터를 삭제하고 리셋합니다.</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Info */}
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.8rem' }}>
          Simplanner v1.0.0<br/>
          &copy; 2026 Simplanner Family Hub
        </div>

      </div>
    </div>
  );
}
