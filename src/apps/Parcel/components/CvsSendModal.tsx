import { useEffect, useMemo, useState } from 'react';
import {
  X, Store, ExternalLink, Package, CheckCircle2, Circle,
  MapPin, CreditCard, FileText, ChevronRight, Loader2, Navigation,
  Copy, Ban, Share2, Map as MapIcon, Undo2,
} from 'lucide-react';
import type { useParcelStore } from '../ParcelStore';
import { CvsNearbyMap, type CvsPlace } from './CvsNearbyMap';

const PREFS_KEY = 'simplanner_cvs_prefs';

type StoreBrand = {
  id: string;
  name: string;
  short: string;
  /** 일반 브랜드 검색 (참고용) */
  mapQuery: string;
  /** 택배 가능 매장에 가까운 검색어 */
  parcelMapQuery: string;
  carrierId: string;
  color: string;
  bg: string;
  bookUrl: string;
  /** 공식 택배 접수 가능 매장 찾기 (있는 경우) */
  storeFinderUrl?: string;
  tips: string[];
};

const CVS_BRANDS: StoreBrand[] = [
  {
    id: 'cu',
    name: 'CU 편의점택배',
    short: 'CU',
    mapQuery: 'CU 편의점',
    parcelMapQuery: 'CU 편의점택배',
    carrierId: 'kr.cupost',
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.12)',
    bookUrl: 'https://www.cupost.co.kr/',
    storeFinderUrl: 'https://www.cupost.co.kr/mobile/partner/convenienceStore.cupost',
    tips: [
      '모든 CU가 택배를 받는 것은 아닙니다. 접수 가능 매장인지 확인하세요.',
      'CU POST·앱의 매장찾기에서 “접수 가능” 매장을 우선 확인',
      '송장 출력 후 계산대/택배 박스에 투함',
    ],
  },
  {
    id: 'gs',
    name: 'GS Postbox',
    short: 'GS25',
    mapQuery: 'GS25',
    parcelMapQuery: 'GS25 포스트박스',
    carrierId: 'kr.cvsnet',
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.12)',
    bookUrl: 'https://www.cvsnet.co.kr/',
    storeFinderUrl: 'https://www.cvsnet.co.kr/service/search-store/index.do',
    tips: [
      'GS25 전 매장에 Postbox가 있는 것은 아닙니다.',
      '공식 “접수처 찾기”에서 포스트박스 설치 점포를 확인하세요.',
      '예약번호로 라벨 출력 후 접수',
    ],
  },
  {
    id: 'seven',
    name: '세븐일레븐 택배',
    short: '7-ELEVEN',
    mapQuery: '세븐일레븐',
    parcelMapQuery: '세븐일레븐 택배',
    carrierId: 'kr.lotte',
    color: '#e11d48',
    bg: 'rgba(225, 29, 72, 0.1)',
    bookUrl: 'https://www.7-eleven.co.kr/',
    tips: [
      '세븐 전 매장 택배가 아닐 수 있습니다. 방문 전 점포·앱에서 확인하세요.',
      '세븐 앱/홈페이지 택배 메뉴 또는 점원 접수',
      '롯데택배 연계 구간이 많음',
    ],
  },
  {
    id: 'emart24',
    name: '이마트24 택배',
    short: 'emart24',
    mapQuery: '이마트24',
    parcelMapQuery: '이마트24 택배',
    carrierId: 'kr.cjlogistics',
    color: '#ca8a04',
    bg: 'rgba(202, 138, 4, 0.12)',
    bookUrl: 'https://www.emart24.co.kr/',
    tips: [
      '택배 미취급 매장이 있습니다. 방문 전 확인하세요.',
      '매장 접수·앱 안내 확인',
      'CJ대한통운 연계인 경우가 많음',
    ],
  },
];

/** 일반 집 배송 참고 요금 (크기) */
const SIZES_HOME = [
  { id: 'xs', label: '극소', hint: '서류·소형', fee: '약 3,400~4,000원', box: '소형' },
  { id: 's', label: '소', hint: '책·옷 조금', fee: '약 3,600~4,500원', box: '80cm 전후' },
  { id: 'm', label: '중', hint: '신발·생활용품', fee: '약 4,000~5,200원', box: '100cm 전후' },
  { id: 'l', label: '대', hint: '큰 박스', fee: '약 4,500~6,500원+', box: '120cm↑' },
] as const;

/** 반값·점포 픽업 참고 요금 (무게) */
const SIZES_HALF = [
  { id: 'h1', label: '500g↓', hint: '서류·소품', fee: '약 1,600~2,000원', box: '반값/알뜰' },
  { id: 'h2', label: '1kg↓', hint: '가벼운 소포', fee: '약 1,800~2,400원', box: '반값/알뜰' },
  { id: 'h3', label: '5kg↓', hint: '옷·소형 박스', fee: '약 2,400~2,800원', box: '반값/알뜰' },
] as const;

const CHECKLIST = [
  { id: 'near', label: '근처 편의점 위치 확인' },
  { id: 'parcel', label: '그 매장이 택배 접수 가능 매장인지 확인' },
  { id: 'addr', label: '받는 분 이름·전화·주소 확인' },
  { id: 'pack', label: '내용물 완충 포장 (파손 방지)' },
  { id: 'ban', label: '금지 품목 아님 (액체·고압·유독 등)' },
  { id: 'id', label: '본인 확인 가능한 연락처 준비' },
  { id: 'pay', label: '결제 수단 준비 (앱/카드/현금)' },
] as const;

const BANNED_ITEMS = [
  '인화성·폭발성 물질, 라이터 다량',
  '고압 가스, 스프레이 다량',
  '독극물·유해 화학물질',
  '현금·유가증권 (분실 보상 제한)',
  '생동물, 부패하기 쉬운 식품(일부 제외)',
  '무기·불법 복제물 등 법령 금지 품목',
];

type ServiceMode = 'half' | 'home';

function loadPrefs(): { brandId?: string; serviceMode?: ServiceMode } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePrefs(p: { brandId: string; serviceMode: ServiceMode }) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

function openMapSearch(query: string, lat?: number, lng?: number) {
  const q = encodeURIComponent(query);
  if (lat != null && lng != null) {
    window.open(
      `https://www.google.com/maps/search/${q}/@${lat},${lng},15z`,
      '_blank',
      'noopener,noreferrer'
    );
    return;
  }
  window.open(`https://map.naver.com/p/search/${q}`, '_blank', 'noopener,noreferrer');
}

interface CvsSendModalProps {
  store: ReturnType<typeof useParcelStore>;
  onClose: () => void;
}

export function CvsSendModal({ store, onClose }: CvsSendModalProps) {
  const prefs = loadPrefs();
  const [brandId, setBrandId] = useState(prefs.brandId || 'cu');
  const [serviceMode, setServiceMode] = useState<ServiceMode>(prefs.serviceMode || 'half');
  const [sizeId, setSizeId] = useState('h2');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [itemName, setItemName] = useState('');
  const [toName, setToName] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [toAddr, setToAddr] = useState('');
  const [memo, setMemo] = useState('');
  const [isReturn, setIsReturn] = useState(false);
  /** 접수 전: 받는 분 복사 도우미 펼침 */
  const [showPrepHelper, setShowPrepHelper] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [locStatus, setLocStatus] = useState<'idle' | 'loading' | 'ok' | 'denied' | 'error'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locHint, setLocHint] = useState<string | null>(null);
  const [showBanned, setShowBanned] = useState(false);
  /** 접수 후 추적: 송장 번호 */
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showMap, setShowMap] = useState(true);
  const [mapQuery, setMapQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<CvsPlace | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const brand = CVS_BRANDS.find((b) => b.id === brandId) || CVS_BRANDS[0];
  const sizeList = serviceMode === 'half' ? SIZES_HALF : SIZES_HOME;
  const size = sizeList.find((s) => s.id === sizeId) || sizeList[0];

  // 브랜드 변경 시 지도 검색어·선택 매장 갱신
  useEffect(() => {
    setMapQuery(brand.parcelMapQuery || brand.mapQuery);
    setSelectedPlace(null);
    setMapKey((k) => k + 1);
  }, [brand.id, brand.parcelMapQuery, brand.mapQuery]);

  useEffect(() => {
    // 모드 바꿀 때 해당 모드 기본 크기
    setSizeId(serviceMode === 'half' ? 'h2' : 's');
  }, [serviceMode]);

  useEffect(() => {
    savePrefs({ brandId, serviceMode });
  }, [brandId, serviceMode]);

  const checkCount = useMemo(
    () => CHECKLIST.filter((c) => checked[c.id]).length,
    [checked]
  );
  const allChecked = checkCount === CHECKLIST.length;

  const recipientBlock = useMemo(() => {
    const lines = [
      toName.trim() && `받는 분: ${toName.trim()}`,
      toPhone.trim() && `연락처: ${toPhone.trim()}`,
      toAddr.trim() && `주소: ${toAddr.trim()}`,
    ].filter(Boolean);
    return lines.join('\n');
  }, [toName, toPhone, toAddr]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const requestLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setLocStatus('error');
        setLocHint('이 환경에서는 위치를 쓸 수 없습니다. 지도 검색으로 엽니다.');
        resolve(null);
        return;
      }
      setLocStatus('loading');
      setLocHint(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(c);
          setLocStatus('ok');
          setLocHint('현재 위치 기준으로 근처 매장을 지도에서 엽니다.');
          setChecked((prev) => ({ ...prev, near: true }));
          resolve(c);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocStatus('denied');
            setLocHint('위치 권한이 없어 일반 검색으로 엽니다. 설정에서 허용하면 더 정확합니다.');
          } else {
            setLocStatus('error');
            setLocHint('위치를 가져오지 못했습니다. 지도 검색으로 엽니다.');
          }
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
      );
    });
  };

  /** 내장 지도로 브랜드 근처 검색 */
  const showNearbyOnMap = async (b: StoreBrand = brand, parcelKeyword = true) => {
    let c = coords;
    if (!c) c = await requestLocation();
    const q = parcelKeyword ? b.parcelMapQuery || b.mapQuery : b.mapQuery;
    setMapQuery(q);
    setShowMap(true);
    setSelectedPlace(null);
    setMapKey((k) => k + 1);
    setLocHint(
      c
        ? `내장 지도에 「${q}」 결과를 표시합니다. 택배 가능 여부는 매장·공식 접수처에서 확인하세요.`
        : `위치 없이 검색이 제한될 수 있습니다. 권한을 허용한 뒤 다시 검색해 주세요.`
    );
    setChecked((prev) => ({ ...prev, near: true }));
  };

  const showAllCvsOnMap = async () => {
    let c = coords;
    if (!c) c = await requestLocation();
    setMapQuery('편의점');
    setShowMap(true);
    setSelectedPlace(null);
    setMapKey((k) => k + 1);
    setLocHint(
      '주변 편의점 일반 검색입니다. 택배를 안 받는 매장이 포함될 수 있습니다.'
    );
    setChecked((prev) => ({ ...prev, near: true }));
  };

  const handleSelectPlace = (place: CvsPlace) => {
    setSelectedPlace(place);
    setChecked((prev) => ({ ...prev, near: true }));
    // 메모에 매장 정보 자동 반영 힌트
    if (!memo.includes(place.name)) {
      setMemo((prev) => {
        const line = `접수 후보: ${place.name} (${place.address})`;
        return prev.trim() ? `${prev.trim()}\n${line}` : line;
      });
    }
  };

  /** 외부 지도 앱 (보조) */
  const openExternalMap = async (b: StoreBrand = brand) => {
    let c = coords;
    if (!c) c = await requestLocation();
    const query = b.parcelMapQuery || b.mapQuery;
    if (c) openMapSearch(query, c.lat, c.lng);
    else openMapSearch(query);
  };

  /** 공식 택배 가능 매장 찾기 (GS 포스트박스 설치점 등) */
  const openOfficialStoreFinder = (b: StoreBrand = brand) => {
    if (b.storeFinderUrl) {
      window.open(b.storeFinderUrl, '_blank', 'noopener,noreferrer');
      setLocHint(
        `${b.short} 공식 접수처(택배 가능 매장) 페이지를 열었습니다. 여기 결과가 가장 정확합니다.`
      );
      setChecked((prev) => ({ ...prev, parcel: true }));
      return;
    }
    // 공식 페이지 없으면 내장 지도로 보조
    void showNearbyOnMap(b);
    setLocHint(
      `${b.short}는 공식 접수처 찾기가 제한적입니다. 지도 결과 매장에 택배 접수 여부를 꼭 확인하세요.`
    );
  };

  const openBooking = () => {
    window.open(brand.bookUrl, '_blank', 'noopener,noreferrer');
  };

  const copyRecipient = async () => {
    if (!recipientBlock) {
      setSavedMsg('받는 분 정보를 먼저 입력하세요.');
      window.setTimeout(() => setSavedMsg(null), 2500);
      return;
    }
    try {
      await navigator.clipboard.writeText(recipientBlock);
      setSavedMsg('받는 분 정보를 복사했습니다. 접수 화면에 붙여넣기 하세요.');
      setChecked((prev) => ({ ...prev, addr: true }));
    } catch {
      setSavedMsg('복사에 실패했습니다. 길게 눌러 직접 복사해 주세요.');
    }
    window.setTimeout(() => setSavedMsg(null), 3000);
  };

  const sharePlan = async () => {
    const text = [
      `[편의점 택배 계획]`,
      `브랜드: ${brand.short}`,
      `유형: ${serviceMode === 'half' ? '반값·점포 픽업' : '일반·집 배송'}`,
      `크기: ${size.label} (${size.box}) · ${size.fee}`,
      itemName.trim() && `물건: ${itemName.trim()}`,
      recipientBlock,
      memo.trim(),
    ]
      .filter(Boolean)
      .join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: '편의점 택배', text });
      } else {
        await navigator.clipboard.writeText(text);
        setSavedMsg('계획을 클립보드에 복사했습니다.');
        window.setTimeout(() => setSavedMsg(null), 3000);
      }
    } catch {
      /* 사용자가 공유 취소 */
    }
  };

  /** 공식 접수 완료 후 — 송장만 이 앱에 한 번 등록 (이중 입력 없음) */
  const addTrackingOnly = () => {
    const tn = trackingNumber.trim().replace(/\s/g, '');
    if (!tn) {
      setSavedMsg('운송장 번호를 입력하세요. 접수는 공식 앱/사이트에서 끝난 뒤 붙여 넣으면 됩니다.');
      window.setTimeout(() => setSavedMsg(null), 3500);
      return;
    }

    const title =
      itemName.trim() ||
      `${brand.short} ${isReturn ? '반품' : '발송'}${toName.trim() ? ` → ${toName.trim()}` : ''}`;

    const tags = [
      '편의점택배',
      '발송',
      brand.short,
      serviceMode === 'half' ? '반값' : '일반',
      ...(isReturn ? ['반품'] : []),
    ];

    store.addParcel({
      name: title,
      trackingNumber: tn,
      carrierId: brand.carrierId,
      shop: brand.name,
      memo: [
        isReturn ? '편의점 택배 반품' : '편의점 택배 발송',
        `유형: ${serviceMode === 'half' ? '반값·점포 픽업' : '일반·집 배송'}`,
        selectedPlace
          ? `접수 매장: ${selectedPlace.name} / ${selectedPlace.address}`
          : '',
        recipientBlock,
        memo.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
      tags,
      isFavorite: false,
      status: '배송중',
      direction: 'out',
    });

    setSavedMsg('보내기 목록에 추가했습니다. 이제 여기서 추적만 하면 됩니다.');
    setTrackingNumber('');
    window.setTimeout(() => {
      setSavedMsg(null);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="pc-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="pc-modal-sheet cvs-sheet" role="dialog" aria-labelledby="cvs-title">
        <div className="pc-modal-header">
          <div className="cvs-sheet-title-wrap">
            <Store size={20} color={brand.color} />
            <h2 id="cvs-title">편의점 택배 보내기</h2>
          </div>
          <button type="button" className="pc-icon-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="cvs-sheet-body">
          <p className="cvs-lead">
            <strong>접수는 이 앱에서 되지 않습니다.</strong>
            {' '}공식 사이트·편의점에서 보낸 뒤, <strong>송장 번호만</strong> 여기 붙여 넣으면 됩니다.
          </p>

          <div className="cvs-warn-banner">
            이 화면은 근처 매장·요금 참고 + <strong>추적 등록</strong>용입니다.
            받는 분 주소·결제는 <strong>{brand.short} 공식 접수</strong>에서 한 번만 입력하세요.
          </div>

          {/* 진행 스텝 미니 */}
          <ol className="cvs-steps">
            <li>가능 매장</li>
            <li>유형 참고</li>
            <li>공식 접수</li>
            <li>송장만 여기</li>
          </ol>

          {/* 내 근처 */}
          <div className="cvs-near-panel">
            <div className="cvs-near-head">
              <Navigation size={18} color="#7c3aed" />
              <div>
                <strong>택배 가능한 근처 매장</strong>
                <span>
                  ① 공식 접수처 찾기(가장 정확) → ② 지도 보조 검색 순을 권장합니다.
                </span>
              </div>
            </div>
            <div className="cvs-near-actions">
              <button
                type="button"
                className="cvs-btn-primary"
                onClick={() => showNearbyOnMap()}
                disabled={locStatus === 'loading'}
              >
                {locStatus === 'loading' ? (
                  <Loader2 size={16} className="cvs-spin" />
                ) : (
                  <MapIcon size={16} />
                )}
                내장 지도에서 근처 {brand.short} 보기
              </button>
              <button
                type="button"
                className="cvs-btn-secondary"
                onClick={() => openOfficialStoreFinder()}
              >
                <Store size={16} />
                {brand.storeFinderUrl
                  ? `${brand.short} 공식 접수처 찾기`
                  : `${brand.short} 공식 안내 열기`}
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cvs-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={showAllCvsOnMap}
                  disabled={locStatus === 'loading'}
                >
                  주변 편의점
                </button>
                <button
                  type="button"
                  className="cvs-btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => openExternalMap()}
                  disabled={locStatus === 'loading'}
                >
                  외부 지도
                </button>
              </div>
            </div>
            {locHint && <p className="cvs-loc-hint">{locHint}</p>}
            {locStatus === 'ok' && coords && (
              <p className="cvs-loc-ok">위치 확보됨 · 아래 지도가 이 좌표 기준으로 검색합니다.</p>
            )}

            {showMap && (
              <CvsNearbyMap
                key={`${mapKey}-${mapQuery}`}
                query={mapQuery || brand.parcelMapQuery}
                brandColor={brand.color}
                userCoords={coords}
                selectedId={selectedPlace?.id}
                onSelectPlace={handleSelectPlace}
                radiusM={3000}
              />
            )}

            {selectedPlace && (
              <div className="cvs-selected-store">
                <strong>선택 매장: {selectedPlace.name}</strong>
                {selectedPlace.address}
                {selectedPlace.distanceM != null && (
                  <> · {selectedPlace.distanceM < 1000
                    ? `${selectedPlace.distanceM}m`
                    : `${(selectedPlace.distanceM / 1000).toFixed(1)}km`}</>
                )}
                <div style={{ marginTop: 4, fontSize: '0.72rem', opacity: 0.9 }}>
                  이 매장이 택배를 받는지는 방문·전화·공식 접수처로 확인하세요.
                </div>
              </div>
            )}

            <p className="cvs-note" style={{ marginTop: 10, marginBottom: 0 }}>
              내장 지도는 카카오 장소 검색 결과입니다. GS <strong>포스트박스 설치점</strong> 등
              공식 접수처 찾기가 더 정확합니다.
            </p>
          </div>

          {/* Brand */}
          <h3 className="cvs-block-title">1. 편의점 브랜드</h3>
          <div className="cvs-brand-grid">
            {CVS_BRANDS.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`cvs-brand-card ${brandId === b.id ? 'active' : ''}`}
                style={{
                  borderColor: brandId === b.id ? b.color : undefined,
                  background: brandId === b.id ? b.bg : undefined,
                }}
                onClick={() => setBrandId(b.id)}
              >
                <span className="cvs-brand-short" style={{ color: b.color }}>{b.short}</span>
                <span className="cvs-brand-name">{b.name}</span>
                <span
                  className="cvs-brand-near-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrandId(b.id);
                    void showNearbyOnMap(b);
                  }}
                  role="link"
                >
                  지도에서 보기
                </span>
              </button>
            ))}
          </div>
          <p className="cvs-note">마지막으로 고른 브랜드·유형은 다음에 자동 선택됩니다.</p>

          {/* Service mode */}
          <h3 className="cvs-block-title">2. 접수 유형</h3>
          <div className="cvs-mode-tabs">
            <button
              type="button"
              className={serviceMode === 'half' ? 'active' : ''}
              onClick={() => setServiceMode('half')}
            >
              반값·점포 픽업
              <span>가벼움 · 보통 더 저렴</span>
            </button>
            <button
              type="button"
              className={serviceMode === 'home' ? 'active' : ''}
              onClick={() => setServiceMode('home')}
            >
              일반·집 배송
              <span>문앞 배송 · 권역 요금</span>
            </button>
          </div>
          <p className="cvs-note">
            {serviceMode === 'half'
              ? '받는 분도 편의점 픽업인 상품이 많습니다. 도착 편의점을 미리 정하세요.'
              : '동일권/타권/제주 할증이 붙을 수 있습니다. 접수 화면 금액이 최종입니다.'}
          </p>

          <h3 className="cvs-block-title">3. 예상 크기 · 요금 (참고)</h3>
          <div className="cvs-size-list">
            {sizeList.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`cvs-size-item ${sizeId === s.id ? 'active' : ''}`}
                onClick={() => setSizeId(s.id)}
              >
                <div className="cvs-size-left">
                  <strong>{s.label}</strong>
                  <span>{s.hint} · {s.box}</span>
                </div>
                <span className="cvs-size-fee">{s.fee}</span>
              </button>
            ))}
          </div>

          {/* Banned */}
          <button
            type="button"
            className="cvs-banned-toggle"
            onClick={() => setShowBanned((v) => !v)}
          >
            <Ban size={14} />
            보내면 안 되는 품목 {showBanned ? '접기' : '보기'}
          </button>
          {showBanned && (
            <ul className="cvs-banned-list">
              {BANNED_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}

          {/* Checklist */}
          <h3 className="cvs-block-title">
            4. 보내기 전 체크
            <span className="cvs-check-count">{checkCount}/{CHECKLIST.length}</span>
          </h3>
          <ul className="cvs-checklist">
            {CHECKLIST.map((item) => {
              const on = Boolean(checked[item.id]);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`cvs-check-item ${on ? 'on' : ''}`}
                    onClick={() => toggleCheck(item.id)}
                  >
                    {on ? (
                      <CheckCircle2 size={18} color="#16a34a" />
                    ) : (
                      <Circle size={18} color="#94a3b8" />
                    )}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="cvs-tips" style={{ borderColor: brand.color }}>
            <div className="cvs-tips-title" style={{ color: brand.color }}>
              <MapPin size={14} /> {brand.short} 접수 팁
            </div>
            <ul>
              <li>
                가까운 {brand.short} 중 <strong>택배 접수 가능</strong> 매장인지 확인한 뒤 방문하세요.
              </li>
              {brand.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>

          {/* 공식 접수 (한 번만 입력하는 곳) */}
          <h3 className="cvs-block-title">5. 공식에서 접수</h3>
          <p className="cvs-section-hint">
            이름·전화·주소·결제는 <strong>{brand.short} 공식</strong>에서만 입력하세요.
            여기 앱에 다시 적을 필요 없습니다.
          </p>
          <div className="cvs-actions">
            <button type="button" className="cvs-btn-primary" onClick={openBooking}>
              <ExternalLink size={16} />
              {brand.short} 온라인 접수 열기
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 선택: 붙여넣기용 메모 (접수 폼에 복사) */}
          <button
            type="button"
            className={`cvs-prep-toggle ${showPrepHelper ? 'open' : ''}`}
            onClick={() => setShowPrepHelper((v) => !v)}
          >
            <Copy size={14} />
            받는 분 정보 미리 적어두기 (선택 · 공식 폼에 붙여넣기용)
            <ChevronRight size={16} className="cvs-prep-chevron" />
          </button>
          {showPrepHelper && (
            <div className="cvs-prep-panel">
              <p className="cvs-section-hint">
                이 앱에 “등록”되는 게 아닙니다. 공식 접수 화면에 붙여 넣기 편하게 적어 두는 메모입니다.
              </p>
              <div className="cvs-form">
                <label>
                  받는 분
                  <input
                    type="text"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    placeholder="이름"
                  />
                </label>
                <label>
                  연락처
                  <input
                    type="tel"
                    value={toPhone}
                    onChange={(e) => setToPhone(e.target.value)}
                    placeholder="010-0000-0000"
                  />
                </label>
                <label>
                  주소 (또는 도착 편의점)
                  <input
                    type="text"
                    value={toAddr}
                    onChange={(e) => setToAddr(e.target.value)}
                    placeholder={serviceMode === 'half' ? '예: OO동 GS25 픽업' : '도로명 주소'}
                  />
                </label>
              </div>
              <div className="cvs-inline-actions">
                <button type="button" className="cvs-chip-btn" onClick={copyRecipient}>
                  <Copy size={14} /> 받는 분 복사
                </button>
                <button type="button" className="cvs-chip-btn" onClick={sharePlan}>
                  <Share2 size={14} /> 메모 공유
                </button>
              </div>
            </div>
          )}

          {/* 이 앱의 역할: 송장 추적만 */}
          <h3 className="cvs-block-title">6. 접수 후 · 송장만 등록</h3>
          <p className="cvs-section-hint">
            접수가 끝난 뒤 받은 <strong>운송장 번호만</strong> 넣으면 보내기 목록에서 추적합니다.
          </p>
          <div className="cvs-form">
            <label>
              운송장 번호
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="공식 접수·송장에 적힌 번호"
                autoComplete="off"
              />
            </label>
            <label>
              표시 이름 (선택)
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="예: 책 반납, 중고 옷"
              />
            </label>
            <label>
              메모 (선택)
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 집 앞 CU에서 보냄"
              />
            </label>
            <label className={`pc-return-check form ${isReturn ? 'on' : ''}`}>
              <input
                type="checkbox"
                checked={isReturn}
                onChange={(e) => setIsReturn(e.target.checked)}
              />
              <Undo2 size={14} />
              반품 발송
            </label>
          </div>

          {savedMsg && <div className="cvs-saved-msg">{savedMsg}</div>}

          <div className="cvs-actions">
            <button
              type="button"
              className="cvs-btn-primary"
              onClick={addTrackingOnly}
              disabled={!trackingNumber.trim()}
            >
              <Package size={16} />
              송장으로 추적 시작
            </button>
          </div>

          <div className="cvs-footer-icons">
            <span><MapPin size={12} /> 근처 매장</span>
            <span><ExternalLink size={12} /> 공식 접수</span>
            <span><FileText size={12} /> 송장만 여기</span>
            <span><CreditCard size={12} /> 결제는 공식</span>
          </div>

          {!allChecked && (
            <p className="cvs-note cvs-note-warn">
              택배 가능 매장 확인 후 공식 접수하면 실수가 줄어듭니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
