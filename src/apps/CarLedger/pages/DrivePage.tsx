import React, { useState, useEffect } from 'react';
import { Route, Trash2 } from 'lucide-react';
import { useCarLedgerStore } from '../CarLedgerStore';
import type { DriveRecord } from '../CarLedgerStore';

interface DrivePageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

export const DrivePage: React.FC<DrivePageProps> = ({ store }) => {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vehicleId, setVehicleId] = useState('');
  const [startOdo, setStartOdo] = useState<number | ''>('');
  const [endOdo, setEndOdo] = useState<number | ''>('');
  const [startLoc, setStartLoc] = useState('');
  const [dest, setDest] = useState('');
  const [purpose, setPurpose] = useState<DriveRecord['purpose']>('출퇴근');
  const [memo, setMemo] = useState('');

  // Set initial vehicleId
  useEffect(() => {
    if (store.vehicles.length > 0 && !vehicleId) {
      setVehicleId(store.vehicles[0].id);
    }
  }, [store.vehicles, vehicleId]);

  // Auto-fill start odometer when vehicle changes
  useEffect(() => {
    if (vehicleId) {
      const lastOdo = store.getLastOdometer(vehicleId);
      if (lastOdo > 0) {
        setStartOdo(lastOdo);
      } else {
        setStartOdo('');
      }
    }
  }, [vehicleId, store.getLastOdometer]);

  if (store.vehicles.length === 0) {
    return (
      <div className="cl-page">
        <div className="cl-empty" style={{ marginTop: '40px' }}>
          <p className="cl-empty-text">차량을 먼저 등록해주세요.</p>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || startOdo === '' || endOdo === '') return;

    store.addDrive({
      vehicleId,
      date,
      startOdometer: Number(startOdo),
      endOdometer: Number(endOdo),
      startLocation: startLoc,
      destination: dest,
      purpose,
      memo
    });

    // Reset for next entry
    setStartOdo(Number(endOdo));
    setEndOdo('');
    setStartLoc(dest); // Continuing from destination is a good default
    setDest('');
    setMemo('');
  };

  const distance = (typeof startOdo === 'number' && typeof endOdo === 'number')
    ? Math.max(0, endOdo - startOdo)
    : 0;

  const recentLocations = store.getRecentLocations();

  return (
    <div className="cl-page">
      <h2 className="cl-section-title">주행 기록 추가</h2>
      <form className="cl-form" onSubmit={handleSave}>
        <div className="cl-form-group">
          <label className="cl-form-label">차량</label>
          <select 
            className="cl-vehicle-select" 
            value={vehicleId} 
            onChange={(e) => setVehicleId(e.target.value)}
          >
            {store.vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        
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

        <div className="cl-form-row">
          <div className="cl-form-group">
            <label className="cl-form-label">출발 계기판 (km)</label>
            <input 
              type="number" 
              className="cl-form-input" 
              value={startOdo} 
              onChange={(e) => setStartOdo(e.target.value ? Number(e.target.value) : '')}
              required
            />
          </div>
          <div className="cl-form-group">
            <label className="cl-form-label">도착 계기판 (km)</label>
            <input 
              type="number" 
              className="cl-form-input" 
              value={endOdo} 
              onChange={(e) => setEndOdo(e.target.value ? Number(e.target.value) : '')}
              required
            />
          </div>
        </div>

        {distance > 0 && (
          <div className="cl-form-computed">
            <Route size={16} />
            <span>주행 거리: {distance.toLocaleString()} km</span>
          </div>
        )}

        <div className="cl-form-group">
          <label className="cl-form-label">출발지</label>
          <input 
            type="text" 
            className="cl-form-input" 
            value={startLoc} 
            onChange={(e) => setStartLoc(e.target.value)}
            placeholder="예: 집, 회사"
          />
          {recentLocations.length > 0 && (
            <div className="cl-suggestions cl-chips" style={{ marginTop: '4px' }}>
              {recentLocations.map((loc, idx) => (
                <button 
                  key={`start-${idx}`} 
                  type="button" 
                  className="cl-suggestion-chip cl-chip" 
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setStartLoc(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">도착지</label>
          <input 
            type="text" 
            className="cl-form-input" 
            value={dest} 
            onChange={(e) => setDest(e.target.value)}
            placeholder="예: 거래처, 마트"
          />
          {recentLocations.length > 0 && (
            <div className="cl-suggestions cl-chips" style={{ marginTop: '4px' }}>
              {recentLocations.map((loc, idx) => (
                <button 
                  key={`dest-${idx}`} 
                  type="button" 
                  className="cl-suggestion-chip cl-chip"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={() => setDest(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">목적</label>
          <div className="cl-chips">
            {(['출퇴근', '업무', '개인', '기타'] as const).map(p => (
              <button
                key={p}
                type="button"
                className={`cl-chip ${purpose === p ? 'active' : ''}`}
                onClick={() => setPurpose(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">메모 (선택)</label>
          <input 
            type="text" 
            className="cl-form-input" 
            value={memo} 
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가 메모"
          />
        </div>

        <button type="submit" className="cl-submit-btn">저장하기</button>
      </form>

      <h2 className="cl-section-title">최근 주행 기록</h2>
      {store.drives.length === 0 ? (
        <div className="cl-empty" style={{ marginTop: '20px' }}>
          <p className="cl-empty-text">주행 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="cl-record-list">
          {store.drives.slice(0, 20).map(drive => {
            const vehicle = store.vehicles.find(v => v.id === drive.vehicleId);
            return (
              <div key={drive.id} className="cl-record-item">
                <div className="cl-record-left">
                  <div className="cl-record-icon" style={{ backgroundColor: '#2563eb' }}>
                    <Route size={20} />
                  </div>
                  <div className="cl-record-info">
                    <div className="cl-record-title">
                      {drive.startLocation || '미상'} &rarr; {drive.destination || '미상'}
                    </div>
                    <div className="cl-record-sub">
                      {drive.date} &middot; {drive.purpose} {vehicle ? `· ${vehicle.name}` : ''}
                    </div>
                  </div>
                </div>
                <div className="cl-record-right">
                  <div className="cl-record-value">{drive.distance.toLocaleString()} km</div>
                  <button type="button" className="cl-delete-btn" onClick={() => store.deleteDrive(drive.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
