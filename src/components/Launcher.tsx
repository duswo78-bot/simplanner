import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

import { AppIcon } from './AppIcon';
import type { AppData } from './AppIcon';
import { TopWidget } from './TopWidget';
import { checkParcelBadges } from '../apps/Parcel/ParcelStore';
import './Launcher.css';

const INITIAL_APPS: AppData[] = [
  { id: 'app-planner', name: '플래너', icon: 'Calendar', color: 'linear-gradient(135deg, #fb923c, #ea580c)' },
  { id: 'app-school', name: '학교', icon: 'School', color: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  { id: 'app-account', name: '가계부', icon: 'Wallet', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { id: 'app-health', name: '건강', icon: 'Heart', color: 'linear-gradient(135deg, #ef4444, #dc2626)' },
  { id: 'app-pharmacy', name: '약국/병원', icon: 'Pill', color: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  { id: 'app-bus', name: '대중교통', icon: 'Bus', color: 'linear-gradient(135deg, #eab308, #ca8a04)' },
  { id: 'app-meals', name: '급식', icon: 'Utensils', color: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
  { id: 'app-card', name: '카드/이체', icon: 'CreditCard', color: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { id: 'app-cart', name: '장보기', icon: 'ShoppingCart', color: 'linear-gradient(135deg, #a3e635, #65a30d)' },
  { id: 'app-car', name: '차량 관리', icon: 'Car', color: 'linear-gradient(135deg, #94a3b8, #475569)' },
  { id: 'app-delivery', name: '택배/배송', icon: 'Package', color: 'linear-gradient(135deg, #fb923c, #c2410c)' },
  { id: 'app-restaurant', name: '맛집 추천', icon: 'MapPin', color: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { id: 'app-calculator', name: '계산기', icon: 'Calculator', color: 'linear-gradient(135deg, #38bdf8, #0284c7)' },
  { id: 'app-settings', name: '설정', icon: 'Settings', color: 'linear-gradient(135deg, #64748b, #475569)' },
];

interface LauncherProps {
  onAppClick: (app: AppData) => void;
}

import type { ParcelRecord } from '../apps/Parcel/ParcelStore';

export function Launcher({ onAppClick }: LauncherProps) {
  const [apps, setApps] = useState<AppData[]>(INITIAL_APPS);
  const [parcelNotifications, setParcelNotifications] = useState<ParcelRecord[]>([]);

  useEffect(() => {
    checkParcelBadges().then(arrivals => {
      if (arrivals.length > 0) {
        setParcelNotifications(arrivals);
        setApps(prev => prev.map(a => 
          a.id === 'app-delivery' ? { ...a, badgeCount: arrivals.length } : a
        ));
      }
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 2000,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 2000,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setApps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  function handleAppClick(appId: string) {
    const clickedApp = apps.find(a => a.id === appId);
    if (clickedApp) {
      onAppClick(clickedApp);
    }
  }

  return (
    <div className="launcher-container">
      <TopWidget parcelNotifications={parcelNotifications} />
      
      <div className="apps-grid-wrapper animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={apps.map(app => app.id)}
            strategy={rectSortingStrategy}
          >
            <div className="apps-grid">
              {apps.map((app) => (
                <AppIcon key={app.id} app={app} onClick={handleAppClick} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
