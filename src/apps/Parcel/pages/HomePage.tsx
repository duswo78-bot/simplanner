import React from 'react';
import { Package, Truck, Calendar, CheckCircle, Inbox } from 'lucide-react';
import { useParcelStore, getCarrierName } from '../ParcelStore';

interface HomePageProps {
  store: ReturnType<typeof useParcelStore>;
  onView: (id: string) => void;
}

export function HomePage({ store, onView }: HomePageProps) {
  return (
    <div className="pc-page">
      <div className="pc-section">
        <div className="pc-summary-grid">
          <div className="pc-summary-card">
            <div className="pc-summary-icon" style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
              <Truck size={20} />
            </div>
            <span className="pc-summary-label">배송중</span>
            <span className="pc-summary-value">{store.stats.transit}</span>
          </div>
          <div className="pc-summary-card">
            <div className="pc-summary-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
              <Calendar size={20} />
            </div>
            <span className="pc-summary-label">오늘 도착</span>
            <span className="pc-summary-value">{store.stats.today}</span>
          </div>
          <div className="pc-summary-card">
            <div className="pc-summary-icon" style={{ backgroundColor: '#dcfce3', color: '#15803d' }}>
              <CheckCircle size={20} />
            </div>
            <span className="pc-summary-label">배송 완료</span>
            <span className="pc-summary-value">{store.stats.completed}</span>
          </div>
          <div className="pc-summary-card">
            <div className="pc-summary-icon" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
              <Package size={20} />
            </div>
            <span className="pc-summary-label">전체 건수</span>
            <span className="pc-summary-value">{store.stats.total}</span>
          </div>
        </div>
      </div>

      <div className="pc-section">
        <h2 className="pc-section-title">최근 조회 내역</h2>
        {store.recentParcels.length === 0 ? (
          <div className="pc-empty">
            <Inbox size={48} />
            <p>최근 조회한 택배가 없습니다.</p>
          </div>
        ) : (
          <div className="pc-list">
            {store.recentParcels.map(parcel => (
              <div key={parcel.id} className="pc-card" onClick={() => onView(parcel.id)}>
                <div className="pc-card-header">
                  <h3 className="pc-card-title">{parcel.name}</h3>
                  <span className={`pc-status-badge pc-status-${parcel.status}`}>
                    {parcel.status}
                  </span>
                </div>
                <div className="pc-card-body">
                  <div className="pc-card-row">
                    <Truck size={16} />
                    <span>{getCarrierName(parcel.carrierId)}</span>
                    <span style={{ color: '#cbd5e1' }}>|</span>
                    <span>{parcel.trackingNumber}</span>
                  </div>
                  {parcel.shop && (
                    <div className="pc-card-row">
                      <Package size={16} />
                      <span>{parcel.shop}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
