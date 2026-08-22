import React, { useState, useRef, useMemo } from 'react';
import { Camera, Fuel, Trash2, Droplets, Zap } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { useCarLedgerStore } from '../CarLedgerStore';
import { pushToAccountBook } from '../../shared/EventBus';

interface FuelPageProps {
  store: ReturnType<typeof useCarLedgerStore>;
}

export const FuelPage: React.FC<FuelPageProps> = ({ store }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Stats for Section 1
  const stats = store.getMonthlyStats();
  const avgCostPerKm = stats.mileage > 0 ? Math.round(stats.fuelCost / stats.mileage) : 0;

  // Form State
  const defaultVehicleId = store.vehicles.length > 0 ? store.vehicles[0].id : '';
  const [vehicleId, setVehicleId] = useState(defaultVehicleId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [station, setStation] = useState('');
  const [fuelType, setFuelType] = useState('가솔린');
  const [amount, setAmount] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  
  // For odometer, we auto-fill the last known odometer when vehicle changes
  const lastOdometer = store.getLastOdometer(vehicleId);
  const [odometer, setOdometer] = useState<number | ''>(lastOdometer || '');

  const [ocrProcessing, setOcrProcessing] = useState(false);

  // Auto-calculated fields
  const distance = (typeof odometer === 'number' && odometer > lastOdometer) ? odometer - lastOdometer : 0;
  const computedEfficiency = (distance > 0 && typeof quantity === 'number' && quantity > 0) 
    ? (distance / quantity).toFixed(2) 
    : '-';
  const computedCostPerKm = (distance > 0 && typeof amount === 'number' && amount > 0) 
    ? Math.round(amount / distance) 
    : '-';

  const handleOcr = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrProcessing(true);
    try {
      const result = await Tesseract.recognize(file, 'kor+eng');
      const text = result.data.text;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

      let foundDate = '';
      let foundAmount: number | '' = '';
      let foundQuantity: number | '' = '';
      let foundStation = '';

      // 1. Station Name (usually first line or contains '주유소')
      const stationLine = lines.find(l => l.includes('주유소')) || lines[0] || '';
      foundStation = stationLine.replace(/[^가-힣a-zA-Z0-9\s]/g, '').trim();

      // 2. Date
      const dateMatch = text.match(/20\d{2}[-./]\d{2}[-./]\d{2}/);
      if (dateMatch) {
        foundDate = dateMatch[0].replace(/[-./]/g, '-');
      }

      // 3. Amount
      // Look for lines with 합계, 총액, 승인금액, total or just large numbers with commas
      for (const line of lines) {
        if (line.includes('합계') || line.includes('금액') || line.includes('승인') || line.includes('TOTAL')) {
          const numMatch = line.match(/(\d{1,3}(,\d{3})+)/);
          if (numMatch) {
            foundAmount = parseInt(numMatch[1].replace(/,/g, ''), 10);
            break;
          }
        }
      }
      if (foundAmount === '') {
        const fallbackMatch = text.match(/\b([1-9]\d{0,2}(,\d{3})+)\b/);
        if (fallbackMatch) {
          foundAmount = parseInt(fallbackMatch[1].replace(/,/g, ''), 10);
        }
      }

      // 4. Quantity
      const qtyMatch = text.match(/(\d{1,3}(\.\d{1,3})?)\s*(L|리터|ℓ)/i);
      if (qtyMatch) {
        foundQuantity = parseFloat(qtyMatch[1]);
      }

      if (foundDate) setDate(foundDate);
      if (foundStation) setStation(foundStation.substring(0, 15));
      if (foundAmount !== '') setAmount(foundAmount);
      if (foundQuantity !== '') setQuantity(foundQuantity);

      alert('영수증 인식이 완료되었습니다. 확인 후 저장해주세요.');
    } catch (err) {
      console.error(err);
      alert('영수증 스캔에 실패했습니다. 직접 입력해주세요.');
    } finally {
      setOcrProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const [syncToAccountBook, setSyncToAccountBook] = useState(false);

  const handleSave = () => {
    if (!vehicleId || !date || !amount || !quantity || !odometer) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    store.addFuel({
      vehicleId,
      date,
      station,
      fuelType,
      amount: Number(amount),
      quantity: Number(quantity),
      odometer: Number(odometer),
    });

    if (syncToAccountBook) {
      pushToAccountBook({
        type: 'expense',
        amount: Number(amount),
        category: '차량',
        date,
        memo: `${station || '주유소'} 주유 (${quantity}L)`,
      });
    }

    // Reset form
    setStation('');
    setAmount('');
    setQuantity('');
    setOdometer(Number(odometer)); // Keep current odometer as new baseline
    setSyncToAccountBook(false);
  };

  const fuels = [...store.fuels].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="cl-page">
      {/* Section 1: Monthly Fuel Analysis */}
      <h2 className="cl-section-title">이번 달 주유 통계</h2>
      <div className="cl-fuel-analysis">
        <div className="cl-fuel-stat">
          <div className="cl-fuel-stat-value">{stats.fuelCost.toLocaleString()}원</div>
          <div className="cl-fuel-stat-label">이번 달 주유비</div>
        </div>
        <div className="cl-fuel-stat">
          <div className="cl-fuel-stat-value">{stats.avgEfficiency > 0 ? stats.avgEfficiency.toFixed(1) : '-'} km/L</div>
          <div className="cl-fuel-stat-label">평균 연비</div>
        </div>
        <div className="cl-fuel-stat">
          <div className="cl-fuel-stat-value">{avgCostPerKm > 0 ? avgCostPerKm.toLocaleString() : '-'}원</div>
          <div className="cl-fuel-stat-label">km당 비용</div>
        </div>
      </div>

      {/* Section 2: Fuel Entry Form */}
      <h2 className="cl-section-title">주유 기록 추가</h2>
      <div className="cl-form cl-mb-16">
        {ocrProcessing ? (
          <div className="cl-ocr-processing">
            <div className="cl-ocr-spinner"></div>
            영수증 분석 중...
          </div>
        ) : (
          <button 
            type="button" 
            className="cl-ocr-btn" 
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera size={18} />
            영수증 스캔
          </button>
        )}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleOcr} 
        />

        <div className="cl-form-group">
          <label className="cl-form-label">차량</label>
          <select 
            className="cl-vehicle-select"
            value={vehicleId}
            onChange={e => {
              setVehicleId(e.target.value);
              setOdometer(store.getLastOdometer(e.target.value) || '');
            }}
          >
            {store.vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.number})</option>
            ))}
          </select>
        </div>

        <div className="cl-form-row">
          <div className="cl-form-group">
            <label className="cl-form-label">날짜</label>
            <input 
              type="date" 
              className="cl-form-input" 
              value={date} 
              onChange={e => setDate(e.target.value)} 
            />
          </div>
          <div className="cl-form-group">
            <label className="cl-form-label">주유소</label>
            <input 
              type="text" 
              className="cl-form-input" 
              placeholder="주유소 이름" 
              value={station} 
              onChange={e => setStation(e.target.value)} 
            />
          </div>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">유종</label>
          <div className="cl-chips">
            {['가솔린', '디젤', 'LPG', '전기', '하이브리드', '수소'].map(type => (
              <button
                key={type}
                className={`cl-chip ${fuelType === type ? 'active' : ''}`}
                onClick={() => setFuelType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="cl-form-row">
          <div className="cl-form-group">
            <label className="cl-form-label">주유 금액 (원)</label>
            <input 
              type="number" 
              className="cl-form-input" 
              placeholder="0" 
              value={amount} 
              onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')} 
            />
          </div>
          <div className="cl-form-group">
            <label className="cl-form-label">주유량 (L)</label>
            <input 
              type="number" 
              step="0.01"
              className="cl-form-input" 
              placeholder="0.00" 
              value={quantity} 
              onChange={e => setQuantity(e.target.value ? Number(e.target.value) : '')} 
            />
          </div>
        </div>

        <div className="cl-form-group">
          <label className="cl-form-label">누적 주행거리 (km)</label>
          <input 
            type="number" 
            className="cl-form-input" 
            placeholder="현재 계기판 숫자" 
            value={odometer} 
            onChange={e => setOdometer(e.target.value ? Number(e.target.value) : '')} 
          />
        </div>

        <div className="cl-form-row">
          <div className="cl-form-computed">
            <Droplets size={16} />
            연비: {computedEfficiency} km/L
          </div>
          <div className="cl-form-computed">
            <Zap size={16} />
            비용: {computedCostPerKm !== '-' ? `${computedCostPerKm}원/km` : '-'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '8px', background: '#f8fafc', borderRadius: '8px' }}>
          <input 
            type="checkbox" 
            id="syncAccountBook" 
            checked={syncToAccountBook} 
            onChange={(e) => setSyncToAccountBook(e.target.checked)} 
          />
          <label htmlFor="syncAccountBook" style={{ fontSize: '0.9rem', color: '#475569' }}>가계부 지출로 자동 기록하기</label>
        </div>

        <button 
          className="cl-submit-btn" 
          onClick={handleSave}
          disabled={!vehicleId || !date || !amount || !quantity || !odometer}
        >
          저장하기
        </button>
      </div>

      {/* Section 3: Recent Fuel Records */}
      <h2 className="cl-section-title">최근 주유 내역</h2>
      {fuels.length === 0 ? (
        <div className="cl-empty">
          <Fuel size={40} />
          <p>아직 주유 기록이 없습니다.<br/>새로운 기록을 추가해보세요.</p>
        </div>
      ) : (
        <div className="cl-record-list">
          {fuels.slice(0, 10).map(f => (
            <div key={f.id} className="cl-record-item">
              <div className="cl-record-left">
                <div className="cl-record-icon" style={{ background: '#16a34a' }}>
                  <Fuel size={20} />
                </div>
                <div className="cl-record-info">
                  <div className="cl-record-title">{f.station || '주유'}</div>
                  <div className="cl-record-sub">{f.date} · {f.quantity}L ({f.fuelType})</div>
                </div>
              </div>
              <div className="cl-record-right">
                <div className="cl-record-value">{f.amount.toLocaleString()}원</div>
                <button 
                  className="cl-delete-btn"
                  onClick={() => {
                    if (window.confirm('기록을 삭제하시겠습니까?')) {
                      store.deleteFuel(f.id);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
