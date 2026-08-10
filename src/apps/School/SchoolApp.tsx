import React, { useState, useEffect, useMemo } from 'react';
import { AppContainer } from '../../components/AppContainer';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import { SchoolTabs } from './SchoolTabs';
import { SchoolCalendar } from './SchoolCalendar';

interface SchoolAppProps {
  onBack: () => void;
}

export interface SchoolInfo {
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  address: string;
  grade?: string;
}

const BACKGROUND_IMAGES = [
  `${import.meta.env.BASE_URL}images/school/bg1.jpg`,
  `${import.meta.env.BASE_URL}images/school/bg2.jpg`,
  `${import.meta.env.BASE_URL}images/school/bg3.jpg`,
  `${import.meta.env.BASE_URL}images/school/bg4.jpg`,
];

export function SchoolApp({ onBack }: SchoolAppProps) {
  const [bgImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[randomIndex];
  });
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [activeSchoolCode, setActiveSchoolCode] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSchoolForGrade, setSelectedSchoolForGrade] = useState<SchoolInfo | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const activeSchool = useMemo(() => schools.find(s => s.schoolCode === activeSchoolCode), [schools, activeSchoolCode]);

  useEffect(() => {
    const stored = localStorage.getItem('simplanner_schools');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.length > 0) {
        setSchools(parsed);
        setActiveSchoolCode(parsed[0].schoolCode);
      } else {
        setIsAdding(true);
      }
    } else {
      setIsAdding(true);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const apiKey = import.meta.env.VITE_MEAL_API_KEY || '4027363c70984711b7cb0b491d50a922';
      const url = `https://open.neis.go.kr/hub/schoolInfo?KEY=${apiKey}&Type=json&SCHUL_NM=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.schoolInfo && data.schoolInfo[1].row) {
        const results = data.schoolInfo[1].row.map((item: any) => ({
          officeCode: item.ATPT_OFCDC_SC_CODE,
          schoolCode: item.SD_SCHUL_CODE,
          schoolName: item.SCHUL_NM,
          address: item.ORG_RDNMA
        }));
        setSearchResults(results);
      } else {
        setSearchError('검색 결과가 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSchool = (school: SchoolInfo) => {
    setSelectedSchoolForGrade(school);
  };

  const confirmAddSchool = (grade: string) => {
    if (!selectedSchoolForGrade) return;
    
    const schoolWithGrade = { ...selectedSchoolForGrade, grade };
    
    // Check if we already have this exact school code and grade combination
    // For simplicity, we can just replace the school or add it if the user wants multiple grades of same school.
    // In this implementation, we allow same school with different grades as different tabs, 
    // or just overwrite if it's the same schoolCode. Let's overwrite same schoolCode for simplicity.
    const existingIndex = schools.findIndex(s => s.schoolCode === schoolWithGrade.schoolCode);
    let newSchools = [...schools];
    if (existingIndex >= 0) {
      newSchools[existingIndex] = schoolWithGrade;
    } else {
      newSchools = [...schools, schoolWithGrade].slice(0, 5);
    }
    
    setSchools(newSchools);
    setActiveSchoolCode(schoolWithGrade.schoolCode);
    localStorage.setItem('simplanner_schools', JSON.stringify(newSchools));
    setIsAdding(false);
    setSelectedSchoolForGrade(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (schools.length === 0 || isAdding) {
    if (selectedSchoolForGrade) {
      return (
        <AppContainer title="학년 선택" onBack={() => setSelectedSchoolForGrade(null)} bgImage={bgImage}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '8px' }}>
              {selectedSchoolForGrade.schoolName}의<br/>해당 학년을 선택해주세요
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <button onClick={() => confirmAddSchool('all')} style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>전체 (공통)</button>
              {[1, 2, 3, 4, 5, 6].map(g => (
                <button key={g} onClick={() => confirmAddSchool(g.toString())} style={{ padding: '16px', borderRadius: '12px', border: 'none', background: 'rgba(59, 130, 246, 0.2)', color: '#bfdbfe', fontSize: '1.1rem', cursor: 'pointer' }}>
                  {g}학년
                </button>
              ))}
            </div>
          </div>
        </AppContainer>
      );
    }

    return (
      <AppContainer title="학교 추가" onBack={schools.length > 0 ? () => setIsAdding(false) : onBack} bgImage={bgImage}>
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '8px' }}>학교를 검색해주세요 (최대 5개)</h2>
          
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="예: 경기초, 현대고" 
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '12px', 
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={isSearching}
              style={{
                padding: '12px', borderRadius: '12px', border: 'none', 
                background: '#3b82f6', color: '#fff', cursor: isSearching ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {isSearching ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
            </button>
          </form>

          {searchError && <div style={{ color: '#ef4444', textAlign: 'center', marginTop: '16px', fontSize: '0.9rem' }}>{searchError}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {searchResults.map((school) => (
              <div 
                key={school.schoolCode} 
                onClick={() => selectSchool(school)}
                style={{
                  background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                  border: '1px solid transparent', transition: 'border 0.2s'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>{school.schoolName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{school.address}</div>
                </div>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      </AppContainer>
    );
  }

  return (
    <AppContainer title="학사일정" onBack={onBack} bgImage={bgImage}>
      <SchoolTabs 
        schools={schools} 
        activeSchoolCode={activeSchoolCode} 
        onSelect={setActiveSchoolCode} 
        onAdd={() => setIsAdding(true)} 
      />
      
      {activeSchool && (
        <SchoolCalendar activeSchool={activeSchool} />
      )}
    </AppContainer>
  );
}
