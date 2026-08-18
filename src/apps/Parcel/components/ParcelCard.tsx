import type { MouseEvent } from 'react';
import { Star, Trash2, Pencil, ArrowUpRight, ArrowDownLeft, Undo2 } from 'lucide-react';
import type { ParcelRecord } from '../ParcelStore';
import {
  getCarrierName,
  getParcelDirection,
  isReturnParcel,
  DIRECTION_LABEL,
} from '../ParcelStore';

interface ParcelCardProps {
  parcel: ParcelRecord;
  onView: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleReturn?: (id: string) => void;
}

export function ParcelCard({
  parcel,
  onView,
  onToggleFavorite,
  onDelete,
  onEdit,
  onToggleReturn,
}: ParcelCardProps) {
  const isPendingTracking = parcel.trackingNumber.startsWith('CVS-PENDING');
  const dir = getParcelDirection(parcel);
  const isReturn = isReturnParcel(parcel);

  const handleEdit = (e: MouseEvent) => {
    e.stopPropagation();
    onEdit?.(parcel.id);
  };

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`‘${parcel.name}’ 항목을 삭제할까요?`)) {
      onDelete(parcel.id);
    }
  };

  const handleToggleReturn = (e: MouseEvent) => {
    e.stopPropagation();
    onToggleReturn?.(parcel.id);
  };

  return (
    <div className="pc-card" onClick={() => onView(parcel.id)}>
      <div className="pc-card-header">
        <h3 className="pc-card-title">
          {dir === 'out' && <ArrowUpRight size={16} className="pc-dir-icon out" />}
          {dir === 'in' && <ArrowDownLeft size={16} className="pc-dir-icon in" />}
          {dir === 'return' && <Undo2 size={16} className="pc-dir-icon return" />}
          {parcel.name}
        </h3>
        <div className="pc-card-header-right">
          <span className={`pc-dir-badge ${dir}`}>{DIRECTION_LABEL[dir]}</span>
          <span className={`pc-status-badge pc-status-${parcel.status}`}>
            {parcel.status}
          </span>
        </div>
      </div>
      <div className="pc-card-body">
        <div className="pc-card-row">
          <span>{getCarrierName(parcel.carrierId)}</span>
          <span>·</span>
          <span style={isPendingTracking ? { color: '#7c3aed', fontWeight: 600 } : undefined}>
            {isPendingTracking ? '송장 미등록' : parcel.trackingNumber}
          </span>
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
      <div className="pc-card-actions" onClick={(e) => e.stopPropagation()}>
        {onToggleReturn && (
          <label
            className={`pc-return-check ${isReturn ? 'on' : ''}`}
            onClick={handleToggleReturn}
          >
            <input
              type="checkbox"
              checked={isReturn}
              readOnly
              tabIndex={-1}
            />
            <Undo2 size={14} />
            반품
          </label>
        )}
        <div className="pc-card-actions-right">
          <button
            type="button"
            className="pc-action-btn favorite"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(parcel.id);
            }}
          >
            <Star size={18} fill={parcel.isFavorite ? 'currentColor' : 'none'} />
          </button>
          {onEdit && (
            <button
              type="button"
              className="pc-action-btn edit"
              title="수정"
              onClick={handleEdit}
            >
              <Pencil size={18} />
            </button>
          )}
          <button
            type="button"
            className="pc-action-btn delete"
            title="삭제"
            onClick={handleDelete}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
