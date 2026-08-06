import React from 'react';
import { AppContainer } from '../components/AppContainer';
import { Hammer } from 'lucide-react';

interface EmptyAppProps {
  title: string;
  onBack: () => void;
}

export function EmptyApp({ title, onBack }: EmptyAppProps) {
  return (
    <AppContainer title={title} onBack={onBack}>
      <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <Hammer size={48} color="var(--text-muted)" />
        <h2 style={{ margin: 0, color: 'var(--text-main)' }}>개발 중입니다</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          '{title}' 기능은 아직 준비 중입니다.<br/>조금만 기다려주세요!
        </p>
      </div>
    </AppContainer>
  );
}
