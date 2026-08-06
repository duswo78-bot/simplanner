import React from 'react';
import type { ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
}

export function MobileContainer({ children }: MobileContainerProps) {
  return (
    <div className="mobile-container">
      {children}
    </div>
  );
}
