import { Star, Trash2, Package } from 'lucide-react';
import type { ParcelRecord } from '../ParcelStore';
import { getCarrierName } from '../ParcelStore';

interface ParcelCardProps {
  parcel: ParcelRecord;
  onView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ParcelCard({ parcel, onView, onToggleFavorite, onDelete }: ParcelCardProps) {
  return (
    <div className="pc-card" onClick={() => onView(parcel.id)}>
      <div className="pc-card-header">
        <h3 className="pc-card-title">
          <Package size={18} />
          {parcel.name}
        </h3>
        <span className={`pc-status-badge pc-status-${parcel.status}`}>
          {parcel.status}
        </span>
      </div>
      <div className="pc-card-body">
        <div className="pc-card-row">
          <span>{getCarrierName(parcel.carrierId)}</span>
          <span>·</span>
          <span>{parcel.trackingNumber}</span>
        </div>
        {parcel.shop && (
          <div className="pc-card-row">
            <span>{parcel.shop}</span>
          </div>
        )}
        {parcel.tags && parcel.tags.length > 0 && (
          <div className="pc-card-tags">
            {parcel.tags.map(tag => (
              <span key={tag} className="pc-tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      <div className="pc-card-actions">
        <button
          className={`pc-action-btn favorite`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(parcel.id);
          }}
        >
          <Star size={18} fill={parcel.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <button
          className="pc-action-btn delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(parcel.id);
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
