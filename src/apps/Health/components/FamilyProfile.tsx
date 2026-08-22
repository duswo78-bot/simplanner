import React, { useState } from 'react';
import type { FamilyMember } from '../hooks/useHealthData';

interface FamilyProfileProps {
  onSave: (member: Omit<FamilyMember, 'id' | 'records'>) => void;
  initialData?: FamilyMember;
  onCancel?: () => void;
}

export function FamilyProfile({ onSave, initialData, onCancel }: FamilyProfileProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [birthYear, setBirthYear] = useState<string>(initialData?.birthYear?.toString() || '');
  const [birthMonth, setBirthMonth] = useState<string>(initialData?.birthMonth?.toString() || '');
  const [height, setHeight] = useState<string>(initialData?.height?.toString() || '');
  const [weight, setWeight] = useState<string>(initialData?.weight?.toString() || '');
  const [bloodType, setBloodType] = useState<string>(initialData?.bloodType || 'A');
  const [sidoCd, setSidoCd] = useState<string>(initialData?.sidoCd || '11'); // 기본값: 서울
  const [allergies, setAllergies] = useState<string>(initialData?.allergies?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthYear || !birthMonth) {
      alert('생년월일은 필수입니다.');
      return;
    }

    onSave({
      name,
      birthYear: parseInt(birthYear, 10),
      birthMonth: parseInt(birthMonth, 10),
      height: height ? parseFloat(height) : undefined,
      weight: weight ? parseFloat(weight) : undefined,
      bloodType,
      sidoCd,
      allergies: allergies.split(',').map(a => a.trim()).filter(a => a.length > 0)
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="card">
      <h3>{initialData ? '가족 프로필 수정' : '가족 프로필 등록'}</h3>
      <form className="health-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>이름 (선택)</label>
          <input
            type="text"
            placeholder="예: 나, 아빠, 엄마"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>태어난 연도 (필수)</label>
            <select value={birthYear} onChange={(e) => setBirthYear(e.target.value)} required>
              <option value="">연도 선택</option>
              {years.map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>태어난 달 (필수)</label>
            <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} required>
              <option value="">월 선택</option>
              {months.map(m => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>키 (cm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="170"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>몸무게 (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="65"
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>혈액형</label>
            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
              <option value="A">A형</option>
              <option value="B">B형</option>
              <option value="O">O형</option>
              <option value="AB">AB형</option>
            </select>
          </div>
          
          <div className="form-group" style={{ flex: 1 }}>
            <label>거주지 (시도)</label>
            <select value={sidoCd} onChange={(e) => setSidoCd(e.target.value)}>
              <option value="11">서울특별시</option>
              <option value="26">부산광역시</option>
              <option value="27">대구광역시</option>
              <option value="28">인천광역시</option>
              <option value="29">광주광역시</option>
              <option value="30">대전광역시</option>
              <option value="31">울산광역시</option>
              <option value="36">세종특별자치시</option>
              <option value="41">경기도</option>
              <option value="42">강원도</option>
              <option value="43">충청북도</option>
              <option value="44">충청남도</option>
              <option value="45">전라북도</option>
              <option value="46">전라남도</option>
              <option value="47">경상북도</option>
              <option value="48">경상남도</option>
              <option value="49">제주특별자치도</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '8px' }}>
          <label>알러지 유발 물질 (쉼표로 구분하여 입력)</label>
          <input
            type="text"
            placeholder="예: 우유, 땅콩, 대두, 밀, 토마토"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
          />
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
            입력해두시면 급식 앱과 연동하여 위험 물질 포함 여부를 알려드립니다.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button type="submit" className="primary-btn" style={{ flex: 1 }}>저장하기</button>
          {onCancel && (
            <button type="button" className="danger-btn" onClick={onCancel} style={{ flex: 1, marginTop: '8px' }}>
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
