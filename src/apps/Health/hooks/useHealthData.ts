import { useState, useEffect } from 'react';

export interface HealthRecord {
  id: string;
  date: string;
  weight?: number;
  systolic?: number; // 수축기 혈압
  diastolic?: number; // 이완기 혈압
  notes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  birthYear: number;
  birthMonth: number;
  height?: number;
  weight?: number;
  bloodType?: string;
  sidoCd?: string; // 거주지 (시도 코드)
  allergies?: string[]; // 알러지 목록 (예: "우유", "땅콩", "대두" 등)
  records: HealthRecord[];
}

const STORAGE_KEY = 'simplanner_health_data';

export function useHealthData() {
  const [members, setMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse health data', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  const addMember = (member: Omit<FamilyMember, 'id' | 'records'>) => {
    const newMember: FamilyMember = {
      ...member,
      id: crypto.randomUUID(),
      records: [],
    };
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const addRecord = (memberId: string, record: Omit<HealthRecord, 'id'>) => {
    const newRecord: HealthRecord = {
      ...record,
      id: crypto.randomUUID(),
    };
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, records: [...m.records, newRecord].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()) } : m
      )
    );
  };

  const deleteRecord = (memberId: string, recordId: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, records: m.records.filter((r) => r.id !== recordId) }
          : m
      )
    );
  };

  // 계산 유틸리티
  const calculateAge = (birthYear: number, birthMonth: number) => {
    const today = new Date();
    let age = today.getFullYear() - birthYear;
    if (today.getMonth() + 1 < birthMonth) {
      age--;
    }
    return age;
  };

  const isCheckupYear = (birthYear: number) => {
    const currentYear = new Date().getFullYear();
    // 20세 이상 짝수연도 출생자는 짝수해, 홀수연도 출생자는 홀수해
    const age = currentYear - birthYear;
    if (age < 20) return false;
    
    return (currentYear % 2) === (birthYear % 2);
  };

  return {
    members,
    addMember,
    updateMember,
    deleteMember,
    addRecord,
    deleteRecord,
    calculateAge,
    isCheckupYear
  };
}
