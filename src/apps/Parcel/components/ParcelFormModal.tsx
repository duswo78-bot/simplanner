import React, { useState, useRef } from 'react';
import { Camera, Save, X, Undo2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import {
  detectCarrier,
  CARRIERS,
  isReturnParcel,
  type ParcelRecord,
} from '../ParcelStore';

interface ParcelFormModalProps {
  store: ReturnType<typeof import('../ParcelStore').useParcelStore>;
  onClose: (newId?: string) => void;
  /** 있으면 수정 모드 */
  editParcel?: ParcelRecord | null;
}

export function ParcelFormModal({ store, onClose, editParcel }: ParcelFormModalProps) {
  const isEdit = Boolean(editParcel);
  const pendingTn = editParcel?.trackingNumber?.startsWith('CVS-PENDING') ?? false;

  const [trackingNumber, setTrackingNumber] = useState(
    pendingTn ? '' : (editParcel?.trackingNumber || '')
  );
  const [carrierId, setCarrierId] = useState(editParcel?.carrierId || 'auto');
  const [name, setName] = useState(editParcel?.name || '');
  const [shop, setShop] = useState(editParcel?.shop || '');
  const [memo, setMemo] = useState(editParcel?.memo || '');
  const [isReturn, setIsReturn] = useState(
    editParcel ? isReturnParcel(editParcel) : false
  );
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

  const resolveCarrier = (tn: string): string | null => {
    if (carrierId !== 'auto') return carrierId;
    const detected = detectCarrier(tn);
    return detected?.id ?? null;
  };

  const buildReturnTags = (baseTags: string[], asReturn: boolean, asOut: boolean) => {
    let tags = baseTags.filter((t) => t !== '반품' && t !== '발송');
    if (asOut && !tags.includes('편의점택배')) {
      tags = [...tags, '발송'];
    }
    if (asReturn) {
      tags = [...tags, '반품'];
    }
    return tags;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // 수정 시 송장 미입력이면 기존(임시 포함) 유지
    const tnRaw = trackingNumber.trim().replace(/\s/g, '');
    const tn =
      tnRaw ||
      (isEdit && editParcel ? editParcel.trackingNumber : '');
    if (!tn) {
      alert('운송장 번호를 입력하세요.');
      return;
    }

    const finalCarrierId = resolveCarrier(tn);
    if (!finalCarrierId) {
      alert('택배사를 자동으로 감지할 수 없습니다. 직접 선택해주세요.');
      return;
    }

    if (isEdit && editParcel) {
      const wasOut =
        editParcel.direction === 'out' ||
        editParcel.direction === 'return' ||
        isReturnParcel(editParcel) ||
        editParcel.tags?.includes('발송') ||
        editParcel.tags?.includes('편의점택배') ||
        editParcel.trackingNumber.startsWith('CVS-PENDING');
      const direction: 'in' | 'out' = isReturn || wasOut ? 'out' : 'in';
      // 반품 체크 해제해도 원래 보내기면 보내기 유지
      const asOut = isReturn || wasOut;
      const tags = buildReturnTags(editParcel.tags || [], isReturn, asOut);

      const updates: Partial<ParcelRecord> = {
        name: name.trim(),
        trackingNumber: tn,
        carrierId: finalCarrierId,
        shop: shop.trim(),
        memo: memo.trim(),
        direction,
        tags,
      };
      // 임시 송장 → 실제 번호로 바뀌면 준비 → 배송중
      if (
        editParcel.trackingNumber.startsWith('CVS-PENDING') &&
        !tn.startsWith('CVS-PENDING') &&
        editParcel.status === '준비'
      ) {
        updates.status = '배송중';
      }

      store.updateParcel(editParcel.id, updates);
      onClose(editParcel.id);
      store.syncStatuses();
    } else {
      const newParcel = store.addParcel({
        name: name.trim(),
        trackingNumber: tn,
        carrierId: finalCarrierId,
        shop: shop.trim(),
        memo: memo.trim(),
        direction: isReturn ? 'out' : 'in',
        tags: buildReturnTags([], isReturn, isReturn),
      });
      onClose(newParcel.id);
      store.syncStatuses();
    }
  };

  return (
    <div className="pc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pc-modal-sheet">
        <div className="pc-modal-handle" />
        <div className="pc-modal-header">
          <h2>{isEdit ? '택배 수정' : '택배 추가'}</h2>
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
              required={!isEdit}
              placeholder={pendingTn ? '실제 운송장 번호 입력' : '운송장 번호 입력'}
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
          <label className={`pc-return-check form ${isReturn ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={isReturn}
              onChange={(e) => setIsReturn(e.target.checked)}
            />
            <Undo2 size={14} />
            반품 (보내기로 등록)
          </label>
          <button type="submit" className="pc-btn-primary">
            <Save size={20} /> {isEdit ? '수정 저장' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
