import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import {
  Package, Truck, Calendar, CheckCircle, Inbox,
  ArrowUpRight, ArrowDownLeft, Undo2, Trash2, Pencil,
} from 'lucide-react';
import {
  useParcelStore,
  getCarrierName,
  getParcelDirection,
  isReturnParcel,
  DIRECTION_LABEL,
  type ParcelDashboardFilter,
  type ParcelRecord,
} from '../ParcelStore';

interface HomePageProps {
  store: ReturnType<typeof useParcelStore>;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

const FILTER_LABELS: Record<ParcelDashboardFilter, string> = {
  all: '전체 목록',
  배송중: '배송중',
  오늘도착: '오늘 도착',
  완료: '배송 완료',
};

type ListMode = 'in' | 'out' | 'all';

export function HomePage({ store, onView, onEdit }: HomePageProps) {
  const [filter, setFilter] = useState<ParcelDashboardFilter>('all');
  const [listMode, setListMode] = useState<ListMode>('all');

  const filteredList = useMemo(() => {
    if (listMode === 'all') return store.filterParcels(filter, 'all');
    return store.filterParcels(filter, listMode);
  }, [store.parcels, store.filterParcels, filter, listMode]);

  const selectFilter = (next: ParcelDashboardFilter) => {
    setListMode('all');
    setFilter((prev) => (prev === next && listMode === 'all' ? 'all' : next));
  };

  const selectDirOnCard = (
    dir: 'in' | 'out',
    status: ParcelDashboardFilter,
    e: MouseEvent
  ) => {
    e.stopPropagation();
    setListMode(dir);
    setFilter(status);
  };

  const handleDelete = (id: string, name: string, e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`‘${name}’ 항목을 삭제할까요?`)) {
      store.deleteParcel(id);
    }
  };

  const handleEdit = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    onEdit(id);
  };

  const handleToggleReturn = (parcel: ParcelRecord, e: MouseEvent) => {
    e.stopPropagation();
    store.toggleReturn(parcel.id);
  };

  const { stats } = store;
  const showSend = stats.hasAnyOutbound;

  const cards: {
    key: ParcelDashboardFilter;
    label: string;
    inCount: number;
    outCount: number;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
  }[] = [
    {
      key: '배송중',
      label: '배송중',
      inCount: stats.transit,
      outCount: stats.outTransit + stats.outPreparing,
      icon: <Truck size={18} />,
      iconBg: '#dbeafe',
      iconColor: '#1d4ed8',
    },
    {
      key: '오늘도착',
      label: '오늘 도착',
      inCount: stats.today,
      outCount: stats.outToday,
      icon: <Calendar size={18} />,
      iconBg: '#fef3c7',
      iconColor: '#b45309',
    },
    {
      key: '완료',
      label: '배송 완료',
      inCount: stats.completed,
      outCount: stats.outCompleted,
      icon: <CheckCircle size={18} />,
      iconBg: '#dcfce3',
      iconColor: '#15803d',
    },
    {
      key: 'all',
      label: '전체 목록',
      inCount: stats.total,
      outCount: stats.outTotal,
      icon: <Package size={18} />,
      iconBg: '#f1f5f9',
      iconColor: '#475569',
    },
  ];

  const listTitle = (() => {
    const base = FILTER_LABELS[filter];
    if (listMode === 'out') return `보내기 · ${base}`;
    if (listMode === 'in') return `받기 · ${base}`;
    return base;
  })();

  return (
    <div className="pc-page">
      <div className="pc-section">
        <div className="pc-summary-grid">
          {cards.map((c) => {
            const activeIn = listMode === 'in' && filter === c.key;
            const activeOut = listMode === 'out' && filter === c.key;
            const activeAll = listMode === 'all' && filter === c.key;

            return (
              <button
                key={c.key}
                type="button"
                className={`pc-summary-card ${activeAll || activeIn || activeOut ? 'active' : ''}`}
                onClick={() => selectFilter(c.key)}
              >
                {/* 왼쪽: 아이콘 + 카드 이름 */}
                <div className="pc-summary-left">
                  <div
                    className="pc-summary-icon"
                    style={{ backgroundColor: c.iconBg, color: c.iconColor }}
                  >
                    {c.icon}
                  </div>
                  <span className="pc-summary-name">{c.label}</span>
                </div>

                {/* 오른쪽: 보내기·받기 숫자 */}
                <div className={`pc-summary-metrics ${showSend ? 'has-out' : ''}`}>
                  {showSend && (
                    <div
                      className={`pc-metric-row out ${activeOut ? 'active' : ''}`}
                      onClick={(e) => selectDirOnCard('out', c.key, e)}
                      role="presentation"
                    >
                      <span className="pc-metric-label">보내기</span>
                      <span className="pc-metric-value out">{c.outCount}</span>
                    </div>
                  )}
                  <div
                    className={`pc-metric-row in ${activeIn ? 'active' : ''}`}
                    onClick={(e) => selectDirOnCard('in', c.key, e)}
                    role="presentation"
                  >
                    <span className="pc-metric-label">받기</span>
                    <span className="pc-metric-value in">{c.inCount}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pc-section pc-list-section">
        <div className="pc-list-section-bg" aria-hidden />
        <div className="pc-list-section-inner">
          <div className="pc-section-head">
            <h2 className="pc-section-title">
              {listMode === 'out' && <ArrowUpRight size={16} className="pc-dir-icon out" />}
              {listMode === 'in' && <ArrowDownLeft size={16} className="pc-dir-icon in" />}
              {listTitle}
              <span className="pc-section-count">{filteredList.length}</span>
            </h2>
            {(filter !== 'all' || listMode !== 'all') && (
              <button
                type="button"
                className="pc-text-btn"
                onClick={() => {
                  setFilter('all');
                  setListMode('all');
                }}
              >
                필터 해제
              </button>
            )}
          </div>

          {filteredList.length === 0 ? (
            <div className="pc-empty">
              <Inbox size={48} />
              <p>표시할 택배가 없습니다.</p>
            </div>
          ) : (
            <div className="pc-list">
              {filteredList.map((parcel) => (
                <ParcelHomeRow
                  key={parcel.id}
                  parcel={parcel}
                  onView={onView}
                  onEdit={(e) => handleEdit(parcel.id, e)}
                  onDelete={(e) => handleDelete(parcel.id, parcel.name, e)}
                  onToggleReturn={(e) => handleToggleReturn(parcel, e)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParcelHomeRow({
  parcel,
  onView,
  onEdit,
  onDelete,
  onToggleReturn,
}: {
  parcel: ParcelRecord;
  onView: (id: string) => void;
  onEdit: (e: MouseEvent) => void;
  onDelete: (e: MouseEvent) => void;
  onToggleReturn: (e: MouseEvent) => void;
}) {
  const dir = getParcelDirection(parcel);
  const pending = parcel.trackingNumber.startsWith('CVS-PENDING');
  const isReturn = isReturnParcel(parcel);

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
          <Truck size={16} />
          <span>{getCarrierName(parcel.carrierId)}</span>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={pending ? { color: '#7c3aed', fontWeight: 600 } : undefined}>
            {pending ? '송장 미등록' : parcel.trackingNumber}
          </span>
        </div>
        {parcel.shop && (
          <div className="pc-card-row">
            <Package size={16} />
            <span>{parcel.shop}</span>
          </div>
        )}
      </div>
      <div className="pc-card-actions" onClick={(e) => e.stopPropagation()}>
        <label
          className={`pc-return-check ${isReturn ? 'on' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleReturn(e);
          }}
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
        <div className="pc-card-actions-right">
          <button type="button" className="pc-action-btn edit" onClick={onEdit} title="수정">
            <Pencil size={16} />
          </button>
          <button type="button" className="pc-action-btn delete" onClick={onDelete} title="삭제">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
