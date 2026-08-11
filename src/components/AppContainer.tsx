import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import './AppContainer.css';

interface AppContainerProps {
  title: string;
  onBack: () => void;
  children: ReactNode;
  bgImage?: string;
  headerAction?: ReactNode;
}

export function AppContainer({ title, onBack, children, bgImage, headerAction }: AppContainerProps) {
  return (
    <div className="app-view-container animate-fade-in" style={bgImage ? { background: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url('${bgImage}') center center / cover no-repeat fixed` } : undefined}>
      <header className="app-header">
        <button className="back-button" onClick={onBack} aria-label="Go back">
          <ChevronLeft size={28} color="#fff" />
        </button>
        <h1 className="app-title">{title}</h1>
        <div className="header-placeholder">{headerAction}</div>
      </header>
      
      <div className="app-content-scroll">
        {children}
      </div>
    </div>
  );
}
