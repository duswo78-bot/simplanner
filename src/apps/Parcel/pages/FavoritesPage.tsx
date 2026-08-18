import { PackageOpen } from 'lucide-react';
import { ParcelCard } from '../components/ParcelCard';
import type { useParcelStore } from '../ParcelStore';

type ParcelStoreType = ReturnType<typeof useParcelStore>;

interface FavoritesPageProps {
  store: ParcelStoreType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export function FavoritesPage({ store, onView, onEdit }: FavoritesPageProps) {
  return (
    <div className="pc-page pc-section">
      <div className="pc-list">
        {store.favorites.length === 0 ? (
          <div className="pc-empty">
            <PackageOpen size={48} />
            <p>즐겨찾기한 배송이 없습니다</p>
          </div>
        ) : (
          store.favorites.map(parcel => (
            <ParcelCard
              key={parcel.id}
              parcel={parcel}
              onView={onView}
              onEdit={onEdit}
              onToggleFavorite={store.toggleFavorite}
              onDelete={store.deleteParcel}
              onToggleReturn={store.toggleReturn}
            />
          ))
        )}
      </div>
    </div>
  );
}
