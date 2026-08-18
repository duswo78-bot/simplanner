import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ParcelCard } from '../components/ParcelCard';
import type { useParcelStore } from '../ParcelStore';

type ParcelStoreType = ReturnType<typeof useParcelStore>;

interface AllPageProps {
  store: ParcelStoreType;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
}

export function AllPage({ store, onView, onEdit }: AllPageProps) {
  const [search, setSearch] = useState('');

  const filteredParcels = useMemo(() => {
    if (!search.trim()) return store.parcels;
    const lowerSearch = search.toLowerCase();
    return store.parcels.filter(p => 
      p.name.toLowerCase().includes(lowerSearch) || 
      p.trackingNumber.includes(lowerSearch)
    );
  }, [store.parcels, search]);

  return (
    <div className="pc-page pc-section">
      <div className="pc-search">
        <Search size={18} style={{ marginRight: 8, color: '#94a3b8' }} />
        <input 
          type="text" 
          placeholder="이름 또는 운송장 번호 검색" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="pc-list">
        {filteredParcels.length === 0 ? (
          <div className="pc-empty">
            <p>검색 결과가 없습니다.</p>
          </div>
        ) : (
          filteredParcels.map(parcel => (
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
