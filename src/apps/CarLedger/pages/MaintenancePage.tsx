import React, { useState, useEffect } from 'react';
import { useCarLedgerStore } from '../CarLedgerStore';
import type { MaintenanceCategory } from '../CarLedgerStore';
import { Wrench, Trash2, Camera, AlertCircle } from 'lucide-react';
import { pushToAccountBook } from '../../shared/EventBus';

interface MaintenancePageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

const CATEGORIES: MaintenanceCategory[] = ['엔진오일', '타이어', '배터리', '브레이크', '점검', '세차', '기타'];

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ store }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState(store.vehicles[0]?.id || '');
  const [category, setCategory] = useState<MaintenanceCategory>('엔진오일');
  const [cost, setCost] = useState('');
  const [mileage, setMileage] = useState('');
  const [memo, setMemo] = useState('');
  const [photo, setPhoto] = useState('');

  // Auto-fill mileage when vehicle changes
  useEffect(() => {
    if (vehicleId) {
      setMileage(store.getLastOdometer(vehicleId).toString());
    }
  }, [vehicleId, store]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhoto(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [syncToAccountBook, setSyncToAccountBook] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;

    store.addMaintenance({
      vehicleId,
      date,
      category,
      cost: Number(cost) || 0,
      mileage: Number(mileage) || 0,
      memo,
      photo,
    });

    if (syncToAccountBook && Number(cost) > 0) {
      pushToAccountBook({
        type: 'expense',
        amount: Number(cost),
        category: '차량',
        date,
        memo: `[정비] ${category} ${memo ? '- ' + memo : ''}`,
      });
    }

    // Reset some fields
    setCost('');
    setMemo('');
    setPhoto('');
    setSyncToAccountBook(false);
  };

  if (store.vehicles.length === 0) {
    return (
      <div className="cl-page">
        <div className="cl-empty">
          <AlertCircle size={48} />
          <p>등록된 차량이 없습니다.<br/>먼저 차량을 등록해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-page">
      <form className="cl-form cl-mb-16" onSubmit={handleSubmit}>
        <div className="cl-form-group">
          <label className="cl-form-label">차량 선택</label>
          <select 
            className="cl-vehicle-select" 
            value={vehicleId} 
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {store.vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
            ))}
          </select>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">정비 항목</label>
          <div className="cl-chips">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                className={`cl-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="cl-form-row">
          <div className="cl-form-group">
            <label className="cl-form-label">날짜</label>
            <input 
              type="date" 
              className="cl-form-input" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="cl-form-group">
            <label className="cl-form-label">비용 (원)</label>
            <input 
              type="number" 
              className="cl-form-input" 
              placeholder="0"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">누적 주행거리 (km)</label>
          <input 
            type="number" 
            className="cl-form-input" 
            placeholder="0"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            required
          />
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">메모</label>
          <input 
            type="text" 
            className="cl-form-input" 
            placeholder="정비 내역 등"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">명세서/사진</label>
          <label className="cl-photo-upload">
            {photo ? (
              <img src={photo} alt="Maintenance" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Camera size={24} />
                <span>사진 추가</span>
              </div>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
          <input 
            type="checkbox" 
            id="syncAccountBookMaint" 
            checked={syncToAccountBook} 
            onChange={(e) => setSyncToAccountBook(e.target.checked)} 
          />
          <label htmlFor="syncAccountBookMaint" style={{ fontSize: '0.9rem', color: '#475569' }}>가계부 지출로 자동 기록하기</label>
        </div>

        <button type="submit" className="cl-submit-btn">저장하기</button>
      </form>

      <h2 className="cl-section-title">최근 정비 내역</h2>
      <div className="cl-record-list">
        {store.maintenances.length === 0 ? (
          <div className="cl-empty" style={{ padding: '20px 0' }}>
            <p>정비 내역이 없습니다.</p>
          </div>
        ) : (
          store.maintenances.map(record => (
            <div key={record.id} className="cl-record-item">
              <div className="cl-record-left">
                <div className="cl-record-icon" style={{ background: '#d97706' }}>
                  <Wrench size={20} />
                </div>
                <div className="cl-record-info">
                  <span className="cl-record-title">{record.category}</span>
                  <span className="cl-record-sub">{record.date} • {record.mileage.toLocaleString()}km</span>
                </div>
              </div>
              <div className="cl-record-right">
                <span className="cl-record-value">{record.cost.toLocaleString()}원</span>
                <button className="cl-delete-btn" onClick={() => store.deleteMaintenance(record.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
