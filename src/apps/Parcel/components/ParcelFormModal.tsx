import React, { useState, useRef } from 'react';
import { Camera, Save, X } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { detectCarrier, CARRIERS } from '../ParcelStore';

interface ParcelFormModalProps {
  store: ReturnType<typeof import('../ParcelStore').useParcelStore>;
  onClose: () => void;
}

export function ParcelFormModal({ store, onClose }: ParcelFormModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierId, setCarrierId] = useState('auto');
  const [name, setName] = useState('');
  const [shop, setShop] = useState('');
  const [memo, setMemo] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng+kor', {
        logger: m => console.log(m),
      });

      const match = text.match(/\d{10,13}/);
      if (match) {
        setTrackingNumber(match[0]);
      } else {
        alert('운송장 번호를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('스캔 중 오류가 발생했습니다.');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber || !name) return;

    let finalCarrierId = carrierId;
    if (finalCarrierId === 'auto') {
      const detected = detectCarrier(trackingNumber);
      if (detected) {
        finalCarrierId = detected.id;
      } else {
        alert('택배사를 자동으로 감지할 수 없습니다. 직접 선택해주세요.');
        return;
      }
    }

    store.addParcel({
      name,
      trackingNumber,
      carrierId: finalCarrierId,
      shop,
      memo,
      tags: [],
      isFavorite: false,
    });
    onClose();
  };

  return (
    <div className="pc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pc-modal-sheet">
        <div className="pc-modal-handle" />
        <div className="pc-modal-header">
          <h2>택배 추가</h2>
          <button type="button" className="pc-icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="pc-scanner-btn" onClick={handleScanClick}>
          <Camera size={20} />
          {isScanning ? '스캔 중...' : '운송장 스캔 (사진/카메라)'}
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <form className="pc-form" onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="pc-form-group">
            <label className="pc-label">운송장번호</label>
            <input
              type="text"
              className="pc-input"
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              required
              placeholder="운송장 번호 입력"
            />
          </div>
          <div className="pc-form-group">
            <label className="pc-label">택배사</label>
            <select
              className="pc-select"
              value={carrierId}
              onChange={e => setCarrierId(e.target.value)}
            >
              <option value="auto">자동 감지</option>
              {CARRIERS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="pc-form-group">
            <label className="pc-label">상품명</label>
            <input
              type="text"
              className="pc-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="상품명 입력"
            />
          </div>
          <div className="pc-form-group">
            <label className="pc-label">주문처</label>
            <input
              type="text"
              className="pc-input"
              value={shop}
              onChange={e => setShop(e.target.value)}
              placeholder="예: 쿠팡, 네이버쇼핑"
            />
          </div>
          <div className="pc-form-group">
            <label className="pc-label">메모</label>
            <input
              type="text"
              className="pc-input"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="기타 메모"
            />
          </div>
          <button type="submit" className="pc-btn-primary">
            <Save size={20} /> 저장
          </button>
        </form>
      </div>
    </div>
  );
}
