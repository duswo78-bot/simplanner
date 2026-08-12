import React, { useEffect, useState } from 'react';
import type { FamilyMember } from '../hooks/useHealthData';
import { useHealthData } from '../hooks/useHealthData';
import { fetchVaccinationInfo, fetchHospitals } from '../api/healthApi';
import type { VaccinationInfo, HospitalInfo } from '../api/healthApi';
import { Loader2 } from 'lucide-react';

interface HealthInfoProps {
  member: FamilyMember;
}

export function HealthInfo({ member }: HealthInfoProps) {
  const { calculateAge, isCheckupYear } = useHealthData();
  const age = calculateAge(member.birthYear, member.birthMonth);
  const checkupYear = isCheckupYear(member.birthYear);

  const [vaccines, setVaccines] = useState<VaccinationInfo[]>([]);
  const [hospitals, setHospitals] = useState<HospitalInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 거주지 코드가 있으면 사용
        const [vacData, hospData] = await Promise.all([
          fetchVaccinationInfo(),
          fetchHospitals(member.sidoCd || '11', searchKeyword) 
        ]);
        setVaccines(vacData.slice(0, 5)); // 처음 5개만 표시
        setHospitals(hospData.slice(0, 5));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [member.sidoCd, searchKeyword]);

  const getHealthAdvice = (age: number) => {
    if (age < 12) {
      return {
        focus: '성장기 발달 및 필수 예방접종',
        diet: '단백질, 칼슘(우유, 치즈), 철분이 풍부한 식단 중심. 인스턴트 식품 지양.',
        precautions: '소아 비만 예방, 충치 예방을 위한 양치 습관 기르기.'
      };
    } else if (age < 20) {
      return {
        focus: '청소년기 뼈 건강 및 스트레스 관리',
        diet: '규칙적인 3식, 비타민과 무기질이 풍부한 과일/채소 섭취.',
        precautions: '수면 부족 방지, 규칙적인 운동으로 체력 기르기.'
      };
    } else if (age < 40) {
      return {
        focus: '성인기 대사증후군 예방',
        diet: '나트륨 섭취 줄이기, 복합 탄수화물 및 고단백 저지방 식단.',
        precautions: '음주 및 흡연 자제, 주 3회 이상의 유산소 운동.'
      };
    } else if (age < 60) {
      return {
        focus: '중년기 심혈관계 질환 및 암 예방',
        diet: '콜레스테롤 관리(오메가3 섭취), 항산화 식품(베리류, 녹황색 채소) 섭취.',
        precautions: '정기적인 국가암검진 필수, 혈압 및 혈당 주기적 체크.'
      };
    } else {
      return {
        focus: '노년기 근감소증 및 인지기능 저하 예방',
        diet: '소화가 잘되는 양질의 단백질(두부, 생선), 칼슘 및 비타민D 보충.',
        precautions: '낙상 주의, 가벼운 근력 운동 및 걷기 운동 생활화.'
      };
    }
  };

  const advice = getHealthAdvice(age);

  return (
    <div className="health-info">
      <div className="card">
        <h3>건강 요약 (만 {age}세)</h3>
        {checkupYear ? (
          <div style={{ backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', color: '#ef4444', marginBottom: '12px', border: '1px solid #fee2e2', fontSize: '0.9rem' }}>
            🎉 <strong>올해는 국가건강검진 대상자입니다!</strong> 잊지 말고 꼭 검진을 받으세요.
          </div>
        ) : (
          <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', color: '#0ea5e9', marginBottom: '12px', border: '1px solid #e0f2fe', fontSize: '0.9rem' }}>
            💡 올해는 일반 국가건강검진 대상 해가 아닙니다.
          </div>
        )}
        
        <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}>
          <p style={{ margin: '0 0 6px 0' }}><strong>주요 관리:</strong> {advice.focus}</p>
          <p style={{ margin: '0 0 6px 0' }}><strong>추천 식단:</strong> {advice.diet}</p>
          <p style={{ margin: 0 }}><strong>주의 사항:</strong> {advice.precautions}</p>
        </div>
      </div>

      <div className="card">
        <h3>주요 감염병 및 예방접종 (질병관리청)</h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : vaccines.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>조회된 예방접종 정보가 없습니다.</p>
        ) : (
          <ul style={{ paddingLeft: '20px', margin: 0, color: '#334155', fontSize: '0.9rem' }}>
            {vaccines.map((v, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>
                <strong>{v.cdNm}</strong>: <span style={{ fontSize: '0.9rem' }}>{v.vcnDesc}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0 }}>가까운 검진기관 (건강보험공단)</h3>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="병원명 또는 동 이름 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              fontSize: '0.9rem',
              color: '#0f172a'
            }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : hospitals.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>조회된 검진기관이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hospitals.map((h, idx) => (
              <div key={idx} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '0.95rem' }}>{h.hmcNm}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', margin: '4px 0' }}>{h.locAddr}</div>
                <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: '500' }}>📞 {h.telNo}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
