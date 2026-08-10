import React from 'react';
import { Plus } from 'lucide-react';

interface SchoolInfo {
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  grade?: string;
}

interface SchoolTabsProps {
  schools: SchoolInfo[];
  activeSchoolCode: string;
  onSelect: (code: string) => void;
  onAdd: () => void;
}

export function SchoolTabs({ schools, activeSchoolCode, onSelect, onAdd }: SchoolTabsProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      overflowX: 'auto',
      paddingBottom: '8px',
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }}>
      <style>{`
        .school-tabs::-webkit-scrollbar { display: none; }
      `}</style>
      <div className="school-tabs" style={{ display: 'flex', gap: '8px', flex: 1 }}>
        {schools.map(school => {
          const isActive = school.schoolCode === activeSchoolCode;
          return (
            <button
              key={school.schoolCode}
              onClick={() => onSelect(school.schoolCode)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: isActive ? '#3b82f6' : 'rgba(0, 0, 0, 0.4)',
                color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.2s, color 0.2s',
                border: isActive ? '1px solid transparent' : '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              {school.schoolName}{school.grade && school.grade !== 'all' ? ` (${school.grade}학년)` : ''}
            </button>
          );
        })}
        {schools.length < 5 && (
          <button
            onClick={onAdd}
            style={{
              padding: '8px 12px',
              borderRadius: '20px',
              border: '1px dashed rgba(255,255,255,0.3)',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="학교 추가"
          >
            <Plus size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
