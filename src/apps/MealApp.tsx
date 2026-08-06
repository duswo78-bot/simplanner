import React, { useState, useEffect, useMemo } from 'react';
import { AppContainer } from '../components/AppContainer';
import { Search, RefreshCw, ChevronRight } from 'lucide-react';
import { SchoolTabs } from './Meal/SchoolTabs';
import { WeeklyCalendar } from './Meal/WeeklyCalendar';
import { MealCard } from './Meal/MealCard';
import { MonthlyCalendarModal } from './Meal/MonthlyCalendarModal';

interface MealAppProps {
  onBack: () => void;
}

interface SchoolInfo {
  officeCode: string;
  schoolCode: string;
  schoolName: string;
  address: string;
}

interface MealData {
  items: string[];
  calories: string;
  origin: string;
  nutrition: string;
  population?: string;
}

const formatDateStr = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const getSunday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day;
  return new Date(date.setDate(diff));
};

export function MealApp({ onBack }: MealAppProps) {
  // State for Schools
  const [schools, setSchools] = useState<SchoolInfo[]>([]);
  const [activeSchoolCode, setActiveSchoolCode] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  
  // State for Searching
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // State for Calendar & Meals
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showMonthly, setShowMonthly] = useState(false);
  const [weeklyMeals, setWeeklyMeals] = useState<Record<string, MealData>>({});
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [mealError, setMealError] = useState<string | null>(null);

  // Computed
  const activeSchool = useMemo(() => schools.find(s => s.schoolCode === activeSchoolCode), [schools, activeSchoolCode]);
  const currentSunday = useMemo(() => getSunday(selectedDate), [selectedDate]);

  // Init
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

  // Fetch week meals when school or week changes
  useEffect(() => {
    if (!activeSchool) return;

    async function fetchWeeklyMeals() {
      setIsLoadingMeals(true);
      setMealError(null);
      try {
        const apiKey = import.meta.env.VITE_MEAL_API_KEY;
        const fromDate = formatDateStr(currentSunday);
        
        const saturday = new Date(currentSunday);
        saturday.setDate(saturday.getDate() + 6);
        const toDate = formatDateStr(saturday);

        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${apiKey}&Type=json&ATPT_OFCDC_SC_CODE=${activeSchool?.officeCode}&SD_SCHUL_CODE=${activeSchool?.schoolCode}&MLSV_FROM_YMD=${fromDate}&MLSV_TO_YMD=${toDate}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const newWeeklyMeals: Record<string, MealData> = {};

        if (data.mealServiceDietInfo && data.mealServiceDietInfo[1].row) {
          data.mealServiceDietInfo[1].row.forEach((row: any) => {
            const dateStr = row.MLSV_YMD;
            let cleanDdish = row.DDISH_NM.replace(/[0-9*.]/g, '').replace(/\([^)]*\)/g, '');
            const items = cleanDdish.split('<br/>').map((i: string) => i.trim()).filter((i: string) => i);
            
            newWeeklyMeals[dateStr] = {
              items,
              calories: row.CAL_INFO,
              origin: row.ORPLC_INFO,
              nutrition: row.NTR_INFO,
              population: row.MLSV_FGR
            };
          });
        }
        setWeeklyMeals(newWeeklyMeals);
      } catch (err) {
        console.error(err);
        setMealError('주간 식단 정보를 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingMeals(false);
      }
    }

    fetchWeeklyMeals();
  }, [activeSchool, currentSunday]);

  // Handlers
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const apiKey = import.meta.env.VITE_MEAL_API_KEY;
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
    if (schools.find(s => s.schoolCode === school.schoolCode)) {
      // already exists
      setActiveSchoolCode(school.schoolCode);
      setIsAdding(false);
      return;
    }

    const newSchools = [...schools, school].slice(0, 5); // Max 5
    setSchools(newSchools);
    setActiveSchoolCode(school.schoolCode);
    localStorage.setItem('simplanner_schools', JSON.stringify(newSchools));
    setIsAdding(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Render Search View
  if (schools.length === 0 || isAdding) {
    return (
      <AppContainer title="학교 추가" onBack={schools.length > 0 ? () => setIsAdding(false) : onBack}>
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
                background: '#f43f5e', color: '#fff', cursor: isSearching ? 'not-allowed' : 'pointer',
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

  // Render Meal View
  const selectedDateStr = formatDateStr(selectedDate);
  const currentMeal = weeklyMeals[selectedDateStr] || null;

  return (
    <AppContainer title="학교 식단" onBack={onBack}>
      <SchoolTabs 
        schools={schools} 
        activeSchoolCode={activeSchoolCode} 
        onSelect={setActiveSchoolCode} 
        onAdd={() => setIsAdding(true)} 
      />
      
      <WeeklyCalendar 
        currentDate={selectedDate} 
        onDateSelect={setSelectedDate} 
        onOpenMonthly={() => setShowMonthly(true)}
      />

      <MealCard 
        date={selectedDate}
        meal={currentMeal} 
        loading={isLoadingMeals} 
        error={mealError} 
      />

      {showMonthly && (
        <MonthlyCalendarModal 
          currentDate={selectedDate} 
          onClose={() => setShowMonthly(false)} 
          onSelectDate={setSelectedDate} 
        />
      )}
    </AppContainer>
  );
}
