import React from 'react';
import { X, Share2 } from 'lucide-react';
import { getCarrierName } from '../ParcelStore';
import type { ParcelStatus } from '../ParcelStore';

interface TrackingWebViewProps {
  store: ReturnType<typeof import('../ParcelStore').useParcelStore>;
  parcelId: string;
  onClose: () => void;
}

export function TrackingWebView({ store, parcelId, onClose }: TrackingWebViewProps) {
  const parcel = store.parcels.find(p => p.id === parcelId);

  if (!parcel) {
    return null;
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '택배 조회',
          text: `상품명: ${parcel.name}\n택배사: ${getCarrierName(parcel.carrierId)}\n운송장번호: ${parcel.trackingNumber}\n조회링크: https://tracker.delivery/#/${parcel.carrierId}/${parcel.trackingNumber}`
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      alert('공유하기를 지원하지 않는 브라우저입니다.');
    }
  };

  const STATUSES: ParcelStatus[] = ['준비', '배송중', '오늘도착', '완료'];

  return (
    <div className="pc-modal-overlay">
      <div className="pc-modal-full">
        <div className="pc-header">
          <button type="button" className="pc-icon-btn" onClick={onClose}><X size={20} /></button>
          <h1>{parcel.name}</h1>
          <button type="button" className="pc-icon-btn" onClick={handleShare}><Share2 size={20} /></button>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', gap: '8px', overflowX: 'auto', alignItems: 'center' }}>
          <span className="pc-label" style={{ marginRight: '4px' }}>상태 변경:</span>
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => store.updateStatus(parcel.id, status)}
              className={`pc-status-badge pc-status-${status}`}
              style={{
                border: parcel.status === status ? '2px solid #3b82f6' : '1px solid transparent',
                cursor: 'pointer',
                opacity: parcel.status === status ? 1 : 0.6
              }}
            >
              {status}
            </button>
          ))}
        </div>
        <iframe
          src={`https://tracker.delivery/#/${parcel.carrierId}/${parcel.trackingNumber}`}
          className="pc-webview-container"
          title="Tracking Web View"
        />
      </div>
    </div>
  );
}
