import React from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

interface PharmacySearchProps {
  searchType: 'pharmacy' | 'hospital';
  setSearchType: (val: 'pharmacy' | 'hospital') => void;
  sido: string;
  setSido: (val: string) => void;
  sigungu: string;
  setSigungu: (val: string) => void;
  pharmacyName: string;
  setPharmacyName: (val: string) => void;
  hospitalTypes?: string[];
  setHospitalTypes?: (val: string[]) => void;
  showOpenOnly?: boolean;
  setShowOpenOnly?: (val: boolean) => void;
  onSearch: (useLocation?: boolean) => void;
  isSearching: boolean;
}

const hospitalTypesList = [
  { codes: [], label: '전체' },
  { codes: ['A'], label: '종합병원' },
  { codes: ['B'], label: '일반병원' },
  { codes: ['C'], label: '의원' },
  { codes: ['E', 'G'], label: '한방병원/한의원' },
  { codes: ['M', 'N'], label: '치과병원/의원' },
  { codes: ['D'], label: '요양병원' },
  { codes: ['R', 'W', 'U'], label: '보건소/기타(부속의원)' }
];

const regionData: Record<string, string[]> = {
  "서울특별시": ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구","동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구","용산구","은평구","종로구","중구","중랑구"],
  "부산광역시": ["강서구","금정구","기장군","남구","동구","동래구","부산진구","북구","사상구","사하구","서구","수영구","연제구","영도구","중구","해운대구"],
  "대구광역시": ["군위군","남구","달서구","달성군","동구","북구","서구","수성구","중구"],
  "인천광역시": ["강화군","계양구","남동구","동구","미추홀구","부평구","서구","연수구","옹진군","중구"],
  "전남광주통합특별시": ["강진군","고흥군","곡성군","광산구","광양시","구례군","나주시","남구","담양군","동구","목포시","무안군","보성군","북구","서구","순천시","신안군","여수시","영광군","영암군","완도군","장성군","장흥군","진도군","함평군","해남군","화순군"],
  "대전광역시": ["대덕구","동구","서구","유성구","중구"],
  "울산광역시": ["남구","동구","북구","울주군","중구"],
  "세종특별자치시": ["세종특별자치시"],
  "경기도": ["가평군","고양시","과천시","광명시","광주시","구리시","군포시","김포시","남양주시","동두천시","부천시","성남시","수원시","시흥시","안산시","안성시","안양시","양주시","양평군","여주시","연천군","오산시","용인시","의왕시","의정부시","이천시","파주시","평택시","포천시","하남시","화성시"],
  "강원특별자치도": ["강릉시","고성군","동해시","삼척시","속초시","양구군","양양군","영월군","원주시","인제군","정선군","철원군","춘천시","태백시","평창군","홍천군","화천군","횡성군"],
  "충청북도": ["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군","청주시","충주시"],
  "충청남도": ["계룡시","공주시","금산군","논산시","당진시","보령시","부여군","서산시","서천군","아산시","예산군","천안시","청양군","태안군","홍성군"],
  "전북특별자치도": ["고창군","군산시","김제시","남원시","무주군","부안군","순창군","완주군","익산시","임실군","장수군","전주시","정읍시","진안군"],
  "경상북도": ["경산시","경주시","고령군","구미시","김천시","문경시","봉화군","상주시","성주군","안동시","영덕군","영양군","영주시","영천시","예천군","울릉군","울진군","의성군","청도군","청송군","칠곡군","포항시"],
  "경상남도": ["거제시","거창군","고성군","김해시","남해군","밀양시","사천시","산청군","양산시","의령군","진주시","창녕군","창원시","통영시","하동군","함안군","함양군","합천군"],
  "제주특별자치도": ["서귀포시","제주시"]
};

export function PharmacySearch({ 
  searchType, setSearchType,
  sido, setSido, 
  sigungu, setSigungu, 
  pharmacyName, setPharmacyName,
  hospitalTypes, setHospitalTypes,
  showOpenOnly, setShowOpenOnly,
  onSearch, isSearching 
}: PharmacySearchProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const handleSidoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSido = e.target.value;
    setSido(newSido);
    setSigungu(''); // Reset sigungu when sido changes
  };

  const handleSigunguChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSigungu(e.target.value);
  };

  const handleHospitalTypeToggle = (codes: string[]) => {
    if (!setHospitalTypes || !hospitalTypes) return;
    
    if (codes.length === 0) {
      if (hospitalTypes.length === 0) {
        setHospitalTypes(['NONE']);
      } else {
        setHospitalTypes([]);
      }
    } else {
      let newTypes = [...hospitalTypes].filter(t => t !== 'NONE');
      
      const allSelected = codes.every(c => newTypes.includes(c));
      if (allSelected) {
        newTypes = newTypes.filter(c => !codes.includes(c));
      } else {
        codes.forEach(c => {
          if (!newTypes.includes(c)) newTypes.push(c);
        });
      }
      
      if (newTypes.length === 0) {
        setHospitalTypes(['NONE']);
      } else {
        setHospitalTypes(newTypes);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Type Toggle */}
      <div style={{ 
        position: 'relative', display: 'flex', background: 'rgba(0,0,0,0.3)', 
        borderRadius: '12px', padding: '4px', marginBottom: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
      }}>
        {/* Animated Background Slider */}
        <div style={{
          position: 'absolute',
          top: '4px', bottom: '4px', left: '4px',
          width: 'calc(50% - 4px)',
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          borderRadius: '8px',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: searchType === 'pharmacy' ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.4), inset 0 2px 3px rgba(255,255,255,0.3), inset 0 -2px 3px rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.1)'
        }} />

        <button
          type="button"
          onClick={() => setSearchType('pharmacy')}
          style={{
            position: 'relative', zIndex: 1, flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
            background: 'transparent',
            color: searchType === 'pharmacy' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: searchType === 'pharmacy' ? 'bold' : 'normal',
            transition: 'color 0.3s', cursor: 'pointer',
            textShadow: searchType === 'pharmacy' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          💊 약국
        </button>
        <button
          type="button"
          onClick={() => setSearchType('hospital')}
          style={{
            position: 'relative', zIndex: 1, flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
            background: 'transparent',
            color: searchType === 'hospital' ? '#fff' : 'rgba(255,255,255,0.6)',
            fontWeight: searchType === 'hospital' ? 'bold' : 'normal',
            transition: 'color 0.3s', cursor: 'pointer',
            textShadow: searchType === 'hospital' ? '0 1px 2px rgba(0,0,0,0.3)' : 'none'
          }}
        >
          🏥 병원
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4', fontWeight: 'bold', marginBottom: '4px' }}>
        <MapPin size={20} />
        <span>지역 및 {searchType === 'pharmacy' ? '약국' : '병원'} 검색</span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <select 
          value={sido}
          onChange={handleSidoChange}
          style={{ 
            flex: 1, padding: '12px', borderRadius: '12px', 
            background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)',
            outline: 'none', fontSize: '0.95rem', appearance: 'none', fontWeight: '500'
          }}
        >
          <option value="" style={{ background: '#1f2937', color: '#fff' }}>시/도 선택</option>
          {Object.keys(regionData).map(region => (
            <option key={region} value={region} style={{ background: '#1f2937', color: '#fff' }}>{region}</option>
          ))}
        </select>

        <select 
          value={sigungu}
          onChange={handleSigunguChange}
          disabled={!sido}
          style={{ 
            flex: 1, padding: '12px', borderRadius: '12px', 
            background: sido ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)', 
            color: sido ? '#fff' : 'rgba(255,255,255,0.4)', 
            border: '1px solid rgba(255,255,255,0.3)',
            outline: 'none', fontSize: '0.95rem', appearance: 'none',
            cursor: sido ? 'pointer' : 'not-allowed',
            fontWeight: sido ? '500' : 'normal'
          }}
        >
          <option value="" style={{ background: '#1f2937', color: '#fff' }}>시/군/구 전체</option>
          {sido && regionData[sido]?.map(gu => (
            <option key={gu} value={gu} style={{ background: '#1f2937', color: '#fff' }}>{gu}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <input 
            type="text"
            value={pharmacyName}
            onChange={(e) => setPharmacyName(e.target.value)}
            placeholder={searchType === 'pharmacy' ? "약국명 (선택)" : "병원명 (선택)"}
            style={{ 
              width: '100%', padding: '12px', borderRadius: '12px', 
              background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              outline: 'none', fontSize: '0.9rem', height: '46px', boxSizing: 'border-box'
            }}
          />
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px', paddingLeft: '4px', gap: '16px' }}>
          {searchType === 'hospital' && setHospitalTypes && hospitalTypes && (
            <label style={{ 
              display: 'flex', alignItems: 'center', gap: '4px', 
              fontSize: '0.85rem', color: hospitalTypes.length === 0 ? '#10b981' : 'rgba(255,255,255,0.8)', 
              cursor: 'pointer', fontWeight: hospitalTypes.length === 0 ? 'bold' : 'normal',
              transition: 'color 0.2s'
            }}>
              <input 
                type="checkbox" 
                checked={hospitalTypes.length === 0}
                onChange={() => handleHospitalTypeToggle([])}
                style={{ cursor: 'pointer', margin: 0, accentColor: '#10b981' }}
              />
              전체선택
            </label>
          )}

          {setShowOpenOnly && showOpenOnly !== undefined && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={showOpenOnly}
                onChange={(e) => setShowOpenOnly(e.target.checked)}
                style={{ cursor: 'pointer', margin: 0, accentColor: '#06b6d4' }}
              />
              <span style={{ 
                color: showOpenOnly ? '#06b6d4' : 'rgba(255,255,255,0.8)', 
                fontSize: '0.85rem',
                fontWeight: showOpenOnly ? 'bold' : 'normal',
                transition: 'color 0.2s'
              }}>
                {searchType === 'hospital' ? '진료중만 보기' : '영업중만 보기'}
              </span>
            </label>
          )}
        </div>
      </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button 
            type="button"
            onClick={() => {
              if (navigator.geolocation) {
                onSearch(true);
              } else {
                alert("위치 정보를 지원하지 않는 브라우저입니다.");
              }
            }}
            disabled={isSearching}
            title="주변 위치로 검색"
            style={{
              width: '46px', height: '46px', borderRadius: '12px', border: 'none', 
              background: isSearching ? 'rgba(255,255,255,0.1)' : '#10b981', 
              color: isSearching ? 'var(--text-muted)' : '#fff', 
              cursor: isSearching ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0
            }}
          >
            <Navigation size={20} />
          </button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>주변 5km</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <button  
            type="submit"
            disabled={isSearching || !sido}
            title="검색하기"
            style={{
              width: '46px', height: '46px', borderRadius: '12px', border: 'none', 
              background: isSearching || !sido ? 'rgba(255,255,255,0.1)' : '#06b6d4', 
              color: isSearching || !sido ? 'var(--text-muted)' : '#fff', 
              cursor: isSearching || !sido ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0
            }}
          >
            <Search size={20} />
          </button>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>찾기</span>
        </div>
      </div>

      {searchType === 'hospital' && setHospitalTypes && hospitalTypes && hospitalTypes.length !== 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px', padding: '0 4px' }}>
          {hospitalTypesList.filter(t => t.codes.length > 0).map(type => {
            const isChecked = type.codes.every(c => hospitalTypes.includes(c));
            return (
              <label key={type.label} style={{ 
                display: 'flex', alignItems: 'center', gap: '4px', 
                fontSize: '0.8rem', color: isChecked ? '#10b981' : 'rgba(255,255,255,0.7)', 
                cursor: 'pointer',
                fontWeight: isChecked ? 'bold' : 'normal',
                transition: 'color 0.2s'
              }}>
                <input 
                  type="checkbox" 
                  value={type.codes[0]}
                  checked={isChecked}
                  onChange={() => handleHospitalTypeToggle(type.codes)}
                  style={{ cursor: 'pointer', margin: 0, accentColor: '#10b981' }}
                />
                {type.label}
              </label>
            );
          })}
        </div>
      )}
    </form>
  );
}
