import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Map, Phone, Clock, MapPin, Stethoscope } from 'lucide-react';

export interface PharmacyData {
  id: string;
  name: string;
  address: string;
  tel: string;
  lat: number;
  lng: number;
  type?: string;
  distance?: number;
  times: {
    [key: number]: { s: string, c: string } | null;
  };
}

interface PharmacyCardProps {
  pharmacy: PharmacyData;
  isHospital?: boolean;
}

const DAY_NAMES: Record<number, string> = {
  1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일', 8: '공휴일'
};

const formatTime = (timeStr?: string) => {
  if (!timeStr || timeStr.length < 4) return '-';
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`;
};

export function PharmacyCard({ pharmacy, isHospital }: PharmacyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [departments, setDepartments] = useState<string[] | null>(null);
  const [isLoadingDept, setIsLoadingDept] = useState(false);

  // Check if open now (Simple logic: checks current day and time)
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1: Mon, 7: Sun
  const currentHHMM = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  
  const todayTime = pharmacy.times[dayOfWeek];
  const isOpenNow = todayTime && parseInt(currentHHMM) >= parseInt(todayTime.s) && parseInt(currentHHMM) <= parseInt(todayTime.c);

  useEffect(() => {
    if (expanded && isHospital && !departments && !isLoadingDept) {
      setIsLoadingDept(true);
      const fetchDept = async () => {
        try {
          const apiKey = import.meta.env.VITE_HOSPITAL_API_KEY;
          const url = `https://apis.data.go.kr/B552657/HsptlAsembySearchService/getHsptlBassInfoInqire?serviceKey=${apiKey}&HPID=${pharmacy.id}`;
          const res = await fetch(url);
          const text = await res.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, "text/xml");
          const dgidIdName = xmlDoc.getElementsByTagName("dgidIdName")[0]?.textContent;
          if (dgidIdName) {
            setDepartments(dgidIdName.split(','));
          } else {
            setDepartments([]);
          }
        } catch (e) {
          console.error(e);
          setDepartments([]);
        } finally {
          setIsLoadingDept(false);
        }
      };
      fetchDept();
    }
  }, [expanded, isHospital, departments, isLoadingDept, pharmacy.id]);

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use kakao map link as a fallback
    const mapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(pharmacy.name)},${pharmacy.lat},${pharmacy.lng}`;
    window.open(mapUrl, '_blank');
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${pharmacy.tel}`, '_self');
  };

  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '16px 20px', 
        borderRadius: '16px', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        background: 'rgba(10, 15, 20, 0.6)'
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 'bold' }}>
              {pharmacy.name}
            </h3>
          </div>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} style={{ flexShrink: 0 }} /> 
            <span style={{ wordBreak: 'keep-all' }}>{pharmacy.address}</span>
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '100px', alignItems: 'flex-end' }}>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePhoneClick}
              style={{
                width: '42px', height: '42px', border: 'none', borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Phone size={18} />
            </button>
            <button
              onClick={handleMapClick}
              style={{
                width: '42px', height: '42px', border: 'none', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)', color: '#fff',
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '2px 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            >
              <Map size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: 'auto' }}>
            {pharmacy.type && (
              <div style={{
                width: '100%', textAlign: 'center', boxSizing: 'border-box',
                background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', 
                padding: '4px 0', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold'
              }}>
                {pharmacy.type}
              </div>
            )}
            <div style={{ 
              width: '100%', textAlign: 'center', boxSizing: 'border-box',
              fontSize: '0.75rem', padding: '4px 0', borderRadius: '6px', fontWeight: 'bold',
              background: isOpenNow ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.1)', 
              color: isOpenNow ? '#06b6d4' : 'var(--text-muted)' 
            }}>
              {isOpenNow ? (isHospital ? '진료중' : '영업중') : (isHospital ? '진료종료' : '영업종료')}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '4px', position: 'relative' }}>
        {expanded ? <ChevronUp size={20} color="var(--text-muted)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
        {pharmacy.distance !== undefined && (
          <div style={{ position: 'absolute', right: '4px', fontSize: '0.85rem', fontWeight: 'bold', color: '#f97316' }}>
            {pharmacy.distance < 1 ? `${Math.round(pharmacy.distance * 1000)}m` : `${pharmacy.distance.toFixed(1)}km`}
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '16px' }}>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#06b6d4', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <Clock size={16} />
              <span>운영 시간 안내</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[1,2,3,4,5,6,7,8].map(dayIdx => {
                const time = pharmacy.times[dayIdx];
                const isToday = dayOfWeek === dayIdx;
                if (!time) return null;
                
                return (
                  <li key={dayIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: isToday ? '#0ea5e9' : 'var(--text-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                    <span>{DAY_NAMES[dayIdx]}</span>
                    <span>{formatTime(time.s)} ~ {formatTime(time.c)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {isHospital && (
            <div style={{ flex: 1, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                <Stethoscope size={16} />
                <span>진료과목</span>
              </div>
              
              {isLoadingDept ? (
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>불러오는 중...</div>
              ) : departments && departments.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignContent: 'flex-start' }}>
                  {departments.map(dept => (
                    <span key={dept} style={{ 
                      fontSize: '0.75rem', padding: '2px 6px', background: 'rgba(16, 185, 129, 0.1)', 
                      color: '#34d399', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' 
                    }}>
                      {dept}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>정보 없음</div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
