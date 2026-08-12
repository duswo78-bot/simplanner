import React, { useState } from 'react';
import { ArrowLeft, Users, Activity, Info, Plus, Edit2 } from 'lucide-react';
import './HealthApp.css';
import { useHealthData } from './hooks/useHealthData';
import { FamilyProfile } from './components/FamilyProfile';
import { HealthTracker } from './components/HealthTracker';
import { HealthInfo } from './components/HealthInfo';

interface HealthAppProps {
  onBack: () => void;
}

export function HealthApp({ onBack }: HealthAppProps) {
  const { members, addMember, updateMember, deleteMember, addRecord, deleteRecord } = useHealthData();
  const [activeTab, setActiveTab] = useState<'profile' | 'tracker' | 'info'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    members.length > 0 ? members[0].id : null
  );

  const selectedMember = members.find((m) => m.id === selectedMemberId) || null;

  return (
    <div className="health-app">
      <header className="health-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={24} />
        </button>
        <h1>건강 관리</h1>
      </header>

      <div className="health-content">
        <div className="member-selector">
          {members.map((m) => (
            <button
              key={m.id}
              className={`member-tab ${selectedMemberId === m.id && selectedMemberId !== 'new' ? 'active' : ''}`}
              onClick={() => {
                setSelectedMemberId(m.id);
                setIsEditing(false);
              }}
            >
              {m.name || '무명'}
            </button>
          ))}
          <button className="member-tab add" onClick={() => {
            setSelectedMemberId('new');
            setIsEditing(false);
          }}>
            <Plus size={16} /> 추가
          </button>
        </div>

        {selectedMemberId === 'new' || members.length === 0 ? (
          <FamilyProfile 
            onSave={(member) => {
              const newMem = addMember(member);
              setSelectedMemberId(newMem.id);
            }} 
          />
        ) : (
          selectedMember && (
            <div className="health-dashboard">
              <div className="tab-nav">
                <button
                  className={activeTab === 'profile' ? 'active' : ''}
                  onClick={() => setActiveTab('profile')}
                >
                  <Users size={18} /> 프로필
                </button>
                <button
                  className={activeTab === 'tracker' ? 'active' : ''}
                  onClick={() => setActiveTab('tracker')}
                >
                  <Activity size={18} /> 기록
                </button>
                <button
                  className={activeTab === 'info' ? 'active' : ''}
                  onClick={() => setActiveTab('info')}
                >
                  <Info size={18} /> 맞춤 정보
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'profile' && (
                  isEditing ? (
                    <FamilyProfile
                      initialData={selectedMember}
                      onSave={(updates) => {
                        updateMember(selectedMember.id, updates);
                        setIsEditing(false);
                      }}
                      onCancel={() => setIsEditing(false)}
                    />
                  ) : (
                    <div className="profile-view">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0 }}>{selectedMember.name} 님의 기본 정보</h3>
                        <button 
                          onClick={() => setIsEditing(true)}
                          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                      <div style={{ marginTop: '16px' }}>
                        <p>생년월일: {selectedMember.birthYear}년 {selectedMember.birthMonth}월</p>
                        <p>키: {selectedMember.height} cm</p>
                        <p>몸무게: {selectedMember.weight} kg</p>
                        <p>혈액형: {selectedMember.bloodType}</p>
                        {selectedMember.sidoCd && (
                          <p>거주지(코드): {selectedMember.sidoCd}</p>
                        )}
                      </div>
                      <button className="danger-btn" onClick={() => deleteMember(selectedMember.id)}>
                        가족 삭제
                      </button>
                    </div>
                  )
                )}
                {activeTab === 'tracker' && (
                  <HealthTracker
                    member={selectedMember}
                    onAddRecord={(rec) => addRecord(selectedMember.id, rec)}
                    onDeleteRecord={(recId) => deleteRecord(selectedMember.id, recId)}
                  />
                )}
                {activeTab === 'info' && (
                  <HealthInfo member={selectedMember} />
                )}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
