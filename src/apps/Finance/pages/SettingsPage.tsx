import React from 'react';
import { Moon, Bell, ShieldAlert, CreditCard, BarChart2, Download, Upload } from 'lucide-react';
import { useFinanceStore } from '../FinanceStore';

interface SettingsPageProps {
  store: ReturnType<typeof useFinanceStore>;
}

export function SettingsPage({ store }: SettingsPageProps) {
  const { settings, updateSettings } = store;

  const Toggle = ({ label, icon, checked, onChange }: { label: string, icon: React.ReactNode, checked: boolean, onChange: (c: boolean) => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1e293b' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.95rem', fontWeight: 500, color: '#e2e8f0' }}>{label}</span>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        style={{ 
          width: '44px', height: '24px', borderRadius: '12px', border: 'none', 
          background: checked ? '#3b82f6' : '#475569', 
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
        }}
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
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', paddingTop: '20px', marginBottom: '8px' }}>화면 설정</h3>
        <Toggle 
          label="다크 모드" 
          icon={<Moon size={18} />} 
          checked={settings.darkMode} 
          onChange={c => updateSettings({ darkMode: c })} 
        />
        
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', paddingTop: '24px', marginBottom: '8px' }}>알림 설정</h3>
        <Toggle 
          label="실적 부족 알림" 
          icon={<ShieldAlert size={18} />} 
          checked={settings.performanceAlert} 
          onChange={c => updateSettings({ performanceAlert: c })} 
        />
        <Toggle 
          label="결제일 알림" 
          icon={<CreditCard size={18} />} 
          checked={settings.paymentAlert} 
          onChange={c => updateSettings({ paymentAlert: c })} 
        />
        <Toggle 
          label="연회비 결제 예정 알림" 
          icon={<Bell size={18} />} 
          checked={settings.annualFeeAlert} 
          onChange={c => updateSettings({ annualFeeAlert: c })} 
        />
        <Toggle 
          label="월간 금융 리포트 알림" 
          icon={<BarChart2 size={18} />} 
          checked={settings.reportAlert} 
          onChange={c => updateSettings({ reportAlert: c })} 
        />
        
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', paddingTop: '24px', marginBottom: '16px' }}>데이터 관리</h3>
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '24px' }}>
          <button className="f-btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Download size={18} /> 백업
          </button>
          <button className="f-btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Upload size={18} /> 복원
          </button>
        </div>
      </div>
    </div>
  );
}
