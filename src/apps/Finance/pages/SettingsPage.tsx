import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Moon, Bell, ShieldAlert, CreditCard, BarChart2, Download, Upload } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface SettingsPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function SettingsPage({ store }: SettingsPageProps) {
  const { settings, updateSettings, exportData, importData } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'ok' | 'err'>('ok');
  const [importing, setImporting] = useState(false);

  const showStatus = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setStatusMsg(msg);
    setStatusType(type);
    window.setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleBackup = () => {
    try {
      exportData();
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

    if (!window.confirm('백업 파일로 현재 카드/이체 데이터를 덮어쓸까요? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setImporting(true);
    try {
      const ok = await importData(file);
      if (ok) {
        showStatus('복원이 완료되었습니다.');
      } else {
        showStatus('올바른 백업 파일이 아닙니다.', 'err');
      }
    } catch {
      showStatus('복원에 실패했습니다.', 'err');
    } finally {
      setImporting(false);
    }
  };

  const Toggle = ({ label, icon, checked, onChange }: {
    label: string;
    icon: ReactNode;
    checked: boolean;
    onChange: (c: boolean) => void;
  }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--f-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--f-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--f-text-primary)' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--f-text-secondary)' }}>{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          width: '44px', height: '24px', borderRadius: '12px', border: 'none',
          background: checked ? '#3b82f6' : 'var(--f-bg-hover)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
        }}
        aria-pressed={checked}
        aria-label={label}
      >
        <div style={{
          width: '20px', height: '20px', borderRadius: '50%', background: 'white',
          position: 'absolute', top: '2px', left: checked ? '22px' : '2px',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
        }} />
      </button>
    </div>
  );

  return (
    <div className="finance-settings-page" style={{ paddingBottom: '80px' }}>
      <div className="f-card" style={{ padding: '0 20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--f-text-muted)', paddingTop: '20px', marginBottom: '8px' }}>화면 설정</h3>
        <Toggle
          label="다크 모드"
          icon={<Moon size={18} />}
          checked={settings.darkMode}
          onChange={c => updateSettings({ darkMode: c })}
        />

        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--f-text-muted)', paddingTop: '24px', marginBottom: '8px' }}>알림 설정</h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--f-text-tertiary)', margin: '0 0 4px', lineHeight: 1.45 }}>
          홈 카드 비서에 표시할 알림입니다. 최대 6개까지 우선순위로 보여 줍니다.
        </p>
        <Toggle
          label="실적 부족 알림"
          icon={<ShieldAlert size={18} />}
          checked={settings.performanceAlert}
          onChange={c => updateSettings({ performanceAlert: c })}
        />
        <Toggle
          label="결제일·자동이체 알림"
          icon={<CreditCard size={18} />}
          checked={settings.paymentAlert}
          onChange={c => updateSettings({ paymentAlert: c })}
        />
        <Toggle
          label="연회비 안내"
          icon={<Bell size={18} />}
          checked={settings.annualFeeAlert}
          onChange={c => updateSettings({ annualFeeAlert: c })}
        />
        <Toggle
          label="월간 금융 요약"
          icon={<BarChart2 size={18} />}
          checked={settings.reportAlert}
          onChange={c => updateSettings({ reportAlert: c })}
        />

        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--f-text-muted)', paddingTop: '24px', marginBottom: '16px' }}>데이터 관리</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--f-text-tertiary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
          카드·자동이체·설정 데이터를 JSON 파일로 백업하거나 복원합니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', paddingBottom: statusMsg ? '12px' : '24px' }}>
          <button
            type="button"
            onClick={handleBackup}
            className="f-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Download size={18} /> 백업
          </button>
          <button
            type="button"
            onClick={handleRestoreClick}
            disabled={importing}
            className="f-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: importing ? 0.6 : 1 }}
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
          <div style={{
            fontSize: '0.85rem',
            color: statusType === 'ok' ? '#34d399' : '#f87171',
            paddingBottom: '20px',
          }}>
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
