import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { FamilyMember, HealthRecord } from '../hooks/useHealthData';
import { Trash2 } from 'lucide-react';

interface HealthTrackerProps {
  member: FamilyMember;
  onAddRecord: (record: Omit<HealthRecord, 'id'>) => void;
  onDeleteRecord: (id: string) => void;
}

export function HealthTracker({ member, onAddRecord, onDeleteRecord }: HealthTrackerProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState<string>('');
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRecord({
      date,
      weight: weight ? parseFloat(weight) : undefined,
      systolic: systolic ? parseInt(systolic, 10) : undefined,
      diastolic: diastolic ? parseInt(diastolic, 10) : undefined,
      notes,
    });
    // 초기화
    setWeight('');
    setSystolic('');
    setDiastolic('');
    setNotes('');
  };

  const chartData = useMemo(() => {
    return member.records.map(r => ({
      date: r.date.substring(5), // MM-DD
      weight: r.weight,
      systolic: r.systolic,
      diastolic: r.diastolic,
    }));
  }, [member.records]);

  return (
    <div className="health-tracker">
      <div className="card">
        <h3>새 기록 추가</h3>
        <form className="health-form" onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>몸무게 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '6px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>혈압 (수축/이완)</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                <input
                  type="number"
                  placeholder="120"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  style={{ width: '50%' }}
                />
                <span style={{ alignSelf: 'center', color: '#64748b' }}>/</span>
                <input
                  type="number"
                  placeholder="80"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  style={{ width: '50%' }}
                />
              </div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>메모</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="특이사항 입력"
              />
            </div>
          </div>
          <button type="submit" className="primary-btn">추가하기</button>
        </form>
      </div>

      {member.records.length > 0 ? (
        <>
          <div className="card" style={{ paddingBottom: '20px' }}>
            <h3>변화 추이</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#64748b" domain={['auto', 'auto']} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748b" domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', color: '#0f172a', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="몸무게(kg)" stroke="#38bdf8" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="systolic" name="수축기 혈압" stroke="#10b981" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="diastolic" name="이완기 혈압" stroke="#fb923c" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3>기록 목록</h3>
            {member.records.slice().reverse().map(record => (
              <div key={record.id} className="record-item">
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{record.date}</div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    {record.weight && <span>몸무게: {record.weight}kg </span>}
                    {record.systolic && record.diastolic && (
                      <span>혈압: {record.systolic}/{record.diastolic} </span>
                    )}
                  </div>
                  {record.notes && <div style={{ fontSize: '0.85rem', marginTop: '4px', color: '#334155' }}>{record.notes}</div>}
                </div>
                <button
                  onClick={() => onDeleteRecord(record.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px' }}>
          아직 기록이 없습니다. 새로운 기록을 추가해보세요.
        </div>
      )}
    </div>
  );
}
