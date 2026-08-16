import { Clock } from 'lucide-react';
import { ParcelCard } from '../components/ParcelCard';
import type { useParcelStore } from '../ParcelStore';

type ParcelStoreType = ReturnType<typeof useParcelStore>;

interface RecentPageProps {
  store: ParcelStoreType;
  onView: (id: string) => void;
}

export function RecentPage({ store, onView }: RecentPageProps) {
  return (
    <div className="pc-page pc-section">
      <div className="pc-list">
        {store.recentParcels.length === 0 ? (
          <div className="pc-empty">
            <Clock size={48} />
            <p>최근 본 배송이 없습니다</p>
          </div>
        ) : (
          store.recentParcels.map(parcel => (
            <ParcelCard 
              key={parcel.id} 
              parcel={parcel} 
              onView={onView} 
              onToggleFavorite={store.toggleFavorite} 
              onDelete={store.deleteParcel} 
            />
          ))
        )}
      </div>
    </div>
  );
}
