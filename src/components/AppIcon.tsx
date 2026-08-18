import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';
import './AppIcon.css';

export interface AppData {
  id: string;
  name: string;
  icon?: keyof typeof LucideIcons;
  color?: string;
  imageUrl?: string;
  badgeCount?: number;
}

interface AppIconProps {
  app: AppData;
  onClick?: (appId: string) => void;
}

export function AppIcon({ app, onClick }: AppIconProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  const IconComponent = app.icon ? (LucideIcons[app.icon] as React.FC<any>) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`app-icon-container ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging && onClick) {
          onClick(app.id);
        }
      }}
    >
      {app.imageUrl ? (
        <div 
          className="app-icon image-icon"
          style={{ backgroundImage: `url(${app.imageUrl})` }}
        />
      ) : (
        <div 
          className="app-icon glass-panel"
          style={{ background: app.color }}
        >
          {IconComponent && <IconComponent size={28} color="#fff" strokeWidth={2} />}
        </div>
      )}
      {app.badgeCount !== undefined && app.badgeCount > 0 && (
        <div className="app-icon-badge">{app.badgeCount}</div>
      )}
      <span className="app-name">{app.name}</span>
    </div>
  );
}
