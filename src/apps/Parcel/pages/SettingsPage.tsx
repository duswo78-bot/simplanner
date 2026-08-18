import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload } from 'lucide-react';
import { useParcelStore } from '../ParcelStore';

interface SettingsPageProps {
  store: ReturnType<typeof useParcelStore>;
}

export function SettingsPage({ store }: SettingsPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'ok' | 'err'>('ok');
  const [importing, setImporting] = useState(false);

  const { settings, updateSettings } = store;

  const showStatus = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setStatusMsg(msg);
    setStatusType(type);
    window.setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleBackup = () => {
    try {
      store.exportData();
      showStatus('백업 파일을 다운로드했습니다.');
    } catch {
      showStatus('백업에 실패했습니다.', 'err');
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!window.confirm('백업 파일로 현재 택배 데이터를 덮어쓸까요? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setImporting(true);
    try {
      const ok = await store.importData(file);
      if (ok) showStatus('복원이 완료되었습니다.');
      else showStatus('올바른 백업 파일이 아닙니다.', 'err');
    } catch {
      showStatus('복원에 실패했습니다.', 'err');
    } finally {
      setImporting(false);
    }
  };

  const toggleAutoCleanup = () => {
    const next = !settings.autoCleanupCompleted;
    updateSettings({ autoCleanupCompleted: next });
    if (next) {
      store.runCleanupNow();
      showStatus(`${settings.autoCleanupDays}일 지난 배송완료 건을 정리했습니다.`);
    }
  };

  return (
    <div className="pc-page">
      <div className="pc-section">
        <h2 className="pc-section-title">설정</h2>
        <div className="pc-settings-list">
          <div
            className="pc-settings-item"
            onClick={() => store.setDarkMode(!store.isDarkMode)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') store.setDarkMode(!store.isDarkMode);
            }}
          >
            <span>다크 모드</span>
            <div className={`pc-toggle ${store.isDarkMode ? 'on' : ''}`}>
              <div className="pc-toggle-knob" />
            </div>
          </div>

          <div
            className="pc-settings-item"
            onClick={toggleAutoCleanup}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') toggleAutoCleanup();
            }}
          >
            <div className="pc-settings-item-text">
              <span>배송완료 자동 정리</span>
              <span className="pc-settings-desc">
                완료 후 {settings.autoCleanupDays}일이 지나면 목록에서 삭제합니다.
              </span>
            </div>
            <div className={`pc-toggle ${settings.autoCleanupCompleted ? 'on' : ''}`}>
              <div className="pc-toggle-knob" />
            </div>
          </div>

          {settings.autoCleanupCompleted && (
            <div className="pc-settings-item pc-settings-item-static">
              <span className="pc-settings-desc">보관 일수</span>
              <select
                className="pc-settings-select"
                value={settings.autoCleanupDays}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const days = Number(e.target.value);
                  updateSettings({ autoCleanupDays: days });
                  store.runCleanupNow();
                }}
              >
                {[3, 7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="pc-section">
        <h2 className="pc-section-title">데이터 관리</h2>
        <p className="pc-settings-lead">
          택배 목록·즐겨찾기·설정을 JSON 파일로 백업하거나 복원합니다.
        </p>
        <div className="pc-settings-actions">
          <button type="button" className="pc-btn-secondary" onClick={handleBackup}>
            <Download size={18} /> 백업
          </button>
          <button
            type="button"
            className="pc-btn-secondary"
            onClick={handleRestoreClick}
            disabled={importing}
          >
            <Upload size={18} /> {importing ? '복원 중…' : '복원'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        {statusMsg && (
          <div className={`pc-status-msg ${statusType === 'ok' ? 'ok' : 'err'}`}>
            {statusMsg}
          </div>
        )}

        <button
          type="button"
          className="pc-settings-item"
          style={{ marginTop: 16, width: '100%' }}
          onClick={() => {
            if (window.confirm('모든 조회 이력을 삭제하시겠습니까?')) {
              store.clearHistory();
              showStatus('조회 이력을 삭제했습니다.');
            }
          }}
        >
          <span style={{ color: '#ef4444' }}>조회 이력 전체 삭제</span>
        </button>
      </div>
    </div>
  );
}
