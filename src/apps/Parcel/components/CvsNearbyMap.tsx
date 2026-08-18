import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPin, Navigation, Store } from 'lucide-react';

const KAKAO_REST_API_KEY = '167bb3713d47a624020a8820a96b95b3';

export type CvsPlace = {
  id: string;
  name: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  distanceM: number | null;
  placeUrl: string;
};

type Props = {
  /** 검색 키워드 (예: CU, GS25 포스트박스) */
  query: string;
  brandColor?: string;
  /** 외부에서 좌표를 넘기면 그걸로 검색 */
  userCoords?: { lat: number; lng: number } | null;
  onSelectPlace?: (place: CvsPlace) => void;
  selectedId?: string | null;
  radiusM?: number;
};

function FitBounds({
  user,
  places,
}: {
  user: { lat: number; lng: number } | null;
  places: CvsPlace[];
}) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = [];
    if (user) pts.push([user.lat, user.lng]);
    places.slice(0, 12).forEach((p) => pts.push([p.lat, p.lng]));
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 16 });
    }
    setTimeout(() => map.invalidateSize(), 80);
  }, [user, places, map]);
  return null;
}

function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

const storeIcon = (color: string, active: boolean) =>
  L.divIcon({
    className: 'cvs-map-pin',
    html: `<div style="
      width:${active ? 28 : 22}px;height:${active ? 28 : 22}px;
      background:${color};
      border:2px solid #fff;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.35);
    "></div>`,
    iconSize: [active ? 28 : 22, active ? 28 : 22],
    iconAnchor: [active ? 14 : 11, active ? 28 : 22],
    popupAnchor: [0, -20],
  });

async function searchKakaoPlaces(
  query: string,
  lat: number,
  lng: number,
  radius: number
): Promise<CvsPlace[]> {
  const baseUrl = import.meta.env.DEV ? '/kakao-api' : 'https://dapi.kakao.com';
  const url =
    `${baseUrl}/v2/local/search/keyword.json?` +
    `query=${encodeURIComponent(query)}` +
    `&x=${lng}&y=${lat}&radius=${radius}&sort=distance&size=15&page=1`;

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Kakao API ${res.status}`);
  const data = await res.json();
  const docs = Array.isArray(data.documents) ? data.documents : [];

  return docs.map((d: {
    id: string;
    place_name: string;
    address_name: string;
    road_address_name: string;
    phone: string;
    x: string;
    y: string;
    distance: string;
    place_url: string;
  }) => ({
    id: d.id,
    name: d.place_name,
    address: d.road_address_name || d.address_name || '',
    phone: d.phone || '',
    lat: parseFloat(d.y),
    lng: parseFloat(d.x),
    distanceM: d.distance ? parseInt(d.distance, 10) : null,
    placeUrl: d.place_url || '',
  }));
}

function formatDistance(m: number | null): string {
  if (m == null || Number.isNaN(m)) return '';
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export function CvsNearbyMap({
  query,
  brandColor = '#7c3aed',
  userCoords: externalCoords,
  onSelectPlace,
  selectedId,
  radiusM = 3000,
}: Props) {
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(externalCoords ?? null);
  const [places, setPlaces] = useState<CvsPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  const defaultCenter = useMemo<[number, number]>(
    () => (user ? [user.lat, user.lng] : [35.5396, 129.3115]),
    [user]
  );

  const runSearch = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true);
      setError(null);
      try {
        // 택배 키워드 + 브랜드 일반 검색을 합쳐 중복 제거
        const q1 = query;
        const q2 = query.includes('택배') || query.includes('포스트')
          ? query.replace(/\s*택배|\s*포스트박스/g, '').trim() || query
          : `${query}`;

        const [a, b] = await Promise.all([
          searchKakaoPlaces(q1, lat, lng, radiusM).catch(() => [] as CvsPlace[]),
          q2 !== q1
            ? searchKakaoPlaces(q2, lat, lng, radiusM).catch(() => [] as CvsPlace[])
            : Promise.resolve([] as CvsPlace[]),
        ]);

        const map = new Map<string, CvsPlace>();
        [...a, ...b].forEach((p) => {
          if (!map.has(p.id)) map.set(p.id, p);
        });
        const merged = [...map.values()].sort(
          (x, y) => (x.distanceM ?? 9e9) - (y.distanceM ?? 9e9)
        );
        setPlaces(merged.slice(0, 20));
        if (merged.length === 0) {
          setError('주변에 검색 결과가 없습니다. 반경을 넓히거나 공식 접수처 찾기를 이용해 주세요.');
        }
      } catch (e) {
        console.error(e);
        setError('매장 검색에 실패했습니다. 네트워크·API 키를 확인해 주세요.');
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [query, radiusM]
  );

  const ensureLocationAndSearch = useCallback(() => {
    if (user) {
      void runSearch(user.lat, user.lng);
      return;
    }
    if (!navigator.geolocation) {
      setError('이 환경에서는 위치를 사용할 수 없습니다.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUser(c);
        setLocLoading(false);
        void runSearch(c.lat, c.lng);
      },
      () => {
        setLocLoading(false);
        setError('위치 권한이 필요합니다. 허용 후 다시 시도해 주세요.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }, [user, runSearch]);

  // 외부 좌표 / 쿼리 변경 시 자동 검색
  useEffect(() => {
    if (externalCoords) {
      setUser(externalCoords);
      void runSearch(externalCoords.lat, externalCoords.lng);
    }
  }, [externalCoords?.lat, externalCoords?.lng, query, runSearch]);

  // 마운트 시 위치 없으면 요청
  useEffect(() => {
    if (!externalCoords && !user) {
      ensureLocationAndSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cvs-map-wrap">
      <div className="cvs-map-toolbar">
        <button
          type="button"
          className="cvs-chip-btn"
          onClick={ensureLocationAndSearch}
          disabled={loading || locLoading}
        >
          {loading || locLoading ? (
            <Loader2 size={14} className="cvs-spin" />
          ) : (
            <Navigation size={14} />
          )}
          내 위치로 다시 검색
        </button>
        <span className="cvs-map-query">「{query}」 · {radiusM / 1000}km</span>
      </div>

      <div className="cvs-map-canvas">
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://xdworld.vworld.kr/2d/Base/service/{z}/{x}/{y}.png"
            attribution="&copy; V-World"
          />
          <InvalidateOnMount />
          <FitBounds user={user} places={places} />

          {user && (
            <CircleMarker
              center={[user.lat, user.lng]}
              radius={8}
              pathOptions={{
                color: '#fff',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 1,
              }}
            >
              <Popup>내 위치</Popup>
            </CircleMarker>
          )}

          {places.map((p) => (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={storeIcon(brandColor, selectedId === p.id)}
              eventHandlers={{
                click: () => onSelectPlace?.(p),
              }}
            >
              <Popup>
                <strong style={{ fontSize: 12 }}>{p.name}</strong>
                <br />
                <span style={{ fontSize: 11 }}>{p.address}</span>
                {p.distanceM != null && (
                  <>
                    <br />
                    <span style={{ fontSize: 11, color: '#7c3aed' }}>
                      {formatDistance(p.distanceM)}
                    </span>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <p className="cvs-map-disclaimer">
        <MapPin size={12} /> 지도 결과 = 일반 매장 검색입니다. <strong>택배 접수 가능 여부는 매장·공식 접수처에서 확인</strong>하세요.
      </p>

      {error && <p className="cvs-map-error">{error}</p>}

      {places.length > 0 && (
        <ul className="cvs-map-list">
          {places.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                className={`cvs-map-list-item ${selectedId === p.id ? 'active' : ''}`}
                onClick={() => onSelectPlace?.(p)}
              >
                <span className="cvs-map-rank" style={{ background: brandColor }}>
                  {i + 1}
                </span>
                <span className="cvs-map-list-body">
                  <strong>{p.name}</strong>
                  <em>{p.address}</em>
                </span>
                <span className="cvs-map-dist">{formatDistance(p.distanceM)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && places.length === 0 && (
        <div className="cvs-map-empty">
          <Store size={20} />
          검색 결과가 없습니다. 공식 접수처 찾기를 이용해 주세요.
        </div>
      )}
    </div>
  );
}
