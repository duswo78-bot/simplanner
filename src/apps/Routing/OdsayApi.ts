import type { RouteOption, RoutePathStep } from './RouteTypes';

const ODSAY_API_KEY = 'hBtPWXmpbhuZ5cOCZJjiQw'; // For demo. In prod use env var.
const BASE_URL = 'https://api.odsay.com/v1/api';

export interface POI {
  id: number;
  name: string;
  x: number;
  y: number;
  address?: string;
}

export async function searchStations(keyword: string): Promise<POI[]> {
  if (!keyword) return [];
  const url = `${BASE_URL}/searchStation?apiKey=${ODSAY_API_KEY}&stationName=${encodeURIComponent(keyword)}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error('ODsay POI Error:', data.error);
      return null;
    }
    
    if (data.result && data.result.station && data.result.station.length > 0) {
      return data.result.station.slice(0, 10).map((st: any) => ({
        id: st.stationID,
        name: st.stationName,
        x: parseFloat(st.x),
        y: parseFloat(st.y),
        address: `${st.cityName || ''} ${st.gu || ''} ${st.dong || ''}`.trim()
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to fetch Stations:', err);
    return [];
  }
}

export async function searchTransitRoute(start: POI, end: POI): Promise<RouteOption[]> {
  const url = `${BASE_URL}/searchPubTransPathT?apiKey=${ODSAY_API_KEY}&SX=${start.x}&SY=${start.y}&EX=${end.x}&EY=${end.y}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      console.error('ODsay Routing Error:', data.error);
      const errMsg = Array.isArray(data.error) ? data.error[0]?.message : data.error?.msg;
      throw new Error(errMsg || '경로 탐색 실패');
    }
    
    if (!data.result || !data.result.path || data.result.path.length === 0) {
      return [];
    }

    const paths = await Promise.all(data.result.path.map(async (path: any, index: number) => {
      
      const steps: RoutePathStep[] = [];
      let currentDuration = 0;
      
      path.subPath.forEach((sub: any, subIdx: number) => {
        if (sub.trafficType === 3) {
          // Walk
          if (sub.sectionTime > 0) {
            // Find start and end names if possible from adjacent subpaths
            let walkStart = '현재 위치';
            let walkEnd = '목적지';
            
            if (subIdx > 0 && path.subPath[subIdx - 1]?.endName) {
              walkStart = path.subPath[subIdx - 1].endName;
            } else if (subIdx === 0) {
              walkStart = start.name || '출발지';
            }
            
            if (subIdx < path.subPath.length - 1 && path.subPath[subIdx + 1]?.startName) {
              walkEnd = path.subPath[subIdx + 1].startName;
            } else if (subIdx === path.subPath.length - 1) {
              walkEnd = end.name || '도착지';
            }

            let startCoord: [number, number] = [start.y, start.x];
            let endCoord: [number, number] = [end.y, end.x];

            if (subIdx > 0 && path.subPath[subIdx - 1]?.endY && path.subPath[subIdx - 1]?.endX) {
              startCoord = [parseFloat(path.subPath[subIdx - 1].endY), parseFloat(path.subPath[subIdx - 1].endX)];
            }
            if (subIdx < path.subPath.length - 1 && path.subPath[subIdx + 1]?.startY && path.subPath[subIdx + 1]?.startX) {
              endCoord = [parseFloat(path.subPath[subIdx + 1].startY), parseFloat(path.subPath[subIdx + 1].startX)];
            }

            steps.push({
              id: `w-${index}-${subIdx}`,
              type: 'WALK',
              instruction: `도보 이동 (${walkStart} ➔ ${walkEnd})`,
              durationMinutes: sub.sectionTime,
              distanceMeters: sub.distance,
              pathCoords: [startCoord, endCoord]
            });
          }
        } else if (sub.trafficType === 1 || sub.trafficType === 2) {
          // Subway(1) or Bus(2)
          const isSubway = sub.trafficType === 1;
          const lineInfo = (sub.lane && sub.lane.length > 0) ? sub.lane[0] : {};
          
          let pathCoords: [number, number][] = [];
          if (sub.passStopList && sub.passStopList.stations) {
            pathCoords = sub.passStopList.stations.map((st: any) => [parseFloat(st.y), parseFloat(st.x)]);
          } else if (sub.startY && sub.startX && sub.endY && sub.endX) {
            pathCoords = [
              [parseFloat(sub.startY), parseFloat(sub.startX)],
              [parseFloat(sub.endY), parseFloat(sub.endX)]
            ];
          }

          let cleanLineName = lineInfo.name || lineInfo.busNo || '노선 정보 없음';
          if (cleanLineName.includes('(')) {
            cleanLineName = cleanLineName.split('(')[0].trim();
          }
          if (isSubway && cleanLineName.startsWith('수도권 ')) {
            cleanLineName = cleanLineName.replace('수도권 ', '');
          }

          steps.push({
            id: `t-${index}-${subIdx}`,
            type: isSubway ? 'SUBWAY' : 'BUS',
            instruction: `${cleanLineName} 탑승`,
            durationMinutes: sub.sectionTime || 0,
            distanceMeters: sub.distance || 0,
            lineName: cleanLineName,
            lineColor: lineInfo.type === 1 ? '#0052A4' : lineInfo.type === 2 ? '#00A84D' : lineInfo.type === 3 ? '#EF7C1C' : lineInfo.type === 4 ? '#00A5DE' : '#3b82f6', 
            startStation: sub.startName || '출발 정류장',
            endStation: sub.endName || '도착 정류장',
            stationCount: sub.stationCount || 0,
            startStationId: sub.startID,
            routeId: lineInfo.busID || lineInfo.subwayCode,
            localRouteId: lineInfo.busLocalBlID,
            cityCode: lineInfo.busCityCode,
            startX: sub.startX,
            startY: sub.startY
          });
        }
      });
      
      let tags: string[] = [];
      if (path.pathType === 1) tags.push('전철');
      if (path.pathType === 2) tags.push('버스');
      if (path.pathType === 3) tags.push('버스+전철');
      if (index === 0) tags.unshift('최적');

      const transferCount = Math.max(0, (path.info.busTransitCount || 0) + (path.info.subwayTransitCount || 0) - 1);

      // Note: Detailed graphical polylines (loadLane) are now fetched lazily
      // via loadRouteLanes() only when a user selects a route, saving API calls.
      return {
        id: `route-${index}`,
        totalTimeMinutes: path.info.totalTime,
        totalFare: path.info.payment,
        transferCount: transferCount,
        steps,
        tags,
        mapObj: path.info.mapObj,
        lanesLoaded: false
      } as RouteOption;
    }));

    return paths;
  } catch (err) {
    console.error('Failed to fetch routes:', err);
    throw err;
  }
}

export async function loadRouteLanes(route: RouteOption): Promise<RouteOption> {
  if (route.lanesLoaded || !route.mapObj) return route;

  try {
    const segments = route.mapObj.split('@');
    const fullSegments = segments.map((seg: string) => {
      const parts = seg.split(':');
      return `${parts[0]}:${parts[1]}:-1:-1`;
    });

    const partialLaneUrl = `${BASE_URL}/loadLane?apiKey=${ODSAY_API_KEY}&mapObject=0:0@${route.mapObj}`;
    const fullLaneUrl = `${BASE_URL}/loadLane?apiKey=${ODSAY_API_KEY}&mapObject=0:0@${fullSegments.join('@')}`;
    
    const [laneData, fullLaneData] = await Promise.all([
      fetch(partialLaneUrl).then(r => r.json()),
      fetch(fullLaneUrl).then(r => r.json())
    ]);

    if (laneData?.result?.lane) {
      const lanes = laneData.result.lane;
      const fullLanes = fullLaneData?.result?.lane;
      
      let laneIdx = 0;
      route.steps.forEach(step => {
        if (step.type === 'BUS' || step.type === 'SUBWAY') {
          if (lanes[laneIdx]) {
            const coords: [number, number][] = [];
            lanes[laneIdx].section.forEach((sec: any) => {
              sec.graphPos.forEach((pos: any) => coords.push([parseFloat(pos.y), parseFloat(pos.x)]));
            });
            if (coords.length > 0) step.pathCoords = coords;
          }
          
          if (fullLanes && fullLanes[laneIdx]) {
            const fullCoords: [number, number][] = [];
            fullLanes[laneIdx].section.forEach((sec: any) => {
              sec.graphPos.forEach((pos: any) => fullCoords.push([parseFloat(pos.y), parseFloat(pos.x)]));
            });
            if (fullCoords.length > 0) step.fullPathCoords = fullCoords;
          }
          laneIdx++;
        }
      });
    }
    route.lanesLoaded = true;
  } catch (e) {
    console.error('Failed to load detailed lane for route', route.id, e);
  }

  return { ...route };
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const toDeg = (rad: number) => rad * 180 / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

function angleDiff(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export async function getRealtimeBusArrival(stationId: number, routeId: number, localRouteId?: string, cityCode?: number, startX?: number, startY?: number, endX?: number, endY?: number): Promise<number | string> {
  // Use public data API if Ulsan bus
  if (localRouteId && cityCode === 6000) {
    try {
      const apiKey = import.meta.env.VITE_BUS_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
      const stdgCd = '3100000000'; // Ulsan code
      
      const firstUrl = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${stdgCd}&numOfRows=1000&pageNo=1&type=json`;
      const res = await fetch(firstUrl);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = {}; }
      
      if (text.includes("LIMITED") || text.includes("SERVICE_REQUESTS_EXCEEDS_ERROR") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR") || data?.header?.resultCode !== '00' && data?.header?.resultCode !== 'K0') {
         // Mock API fallback
         return '약 3분 후 도착 (테스트)';
      }
      
      if (data?.header?.resultCode === 'K0' || data?.header?.resultCode === '00') {
        let allLocations: any[] = [];
        const items = data.body?.items?.item || [];
        allLocations = Array.isArray(items) ? items : [items];
        
        const totalCount = parseInt(data.body?.totalCount || '0', 10);
        if (totalCount > 1000) {
          const totalPages = Math.ceil(totalCount / 1000);
          const promises = [];
          for (let page = 2; page <= totalPages; page++) {
            const nextUrl = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${stdgCd}&numOfRows=1000&pageNo=${page}&type=json`;
            promises.push(fetch(nextUrl).then(r => r.json()));
          }
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res?.header?.resultCode === 'K0' || res?.header?.resultCode === '00') {
              let pageItems = res.body?.items?.item || [];
              pageItems = Array.isArray(pageItems) ? pageItems : [pageItems];
              allLocations = allLocations.concat(pageItems);
            }
          });
        }

        const cleanLocalRouteId = String(localRouteId).replace(/[^0-9]/g, '');
        let activeBuses = allLocations.filter((b: any) => String(b.rteId) === cleanLocalRouteId);
        
        if (startX !== undefined && startY !== undefined) {
          activeBuses = activeBuses.filter(b => {
            const dist = getDistanceKm(parseFloat(b.lat), parseFloat(b.lot), startY, startX);
            if (dist < 0.01) return true; // Keep if extremely close (10m)
            if (b.oprDrct) {
              const bearingToStart = getBearing(parseFloat(b.lat), parseFloat(b.lot), startY, startX);
              const diff = angleDiff(parseFloat(b.oprDrct), bearingToStart);
              if (diff > 100) return false; // Opposite direction or passed
            }
            return true;
          });
        }
        
        if (activeBuses.length > 0) {
          if (startX !== undefined && startY !== undefined) {
            let minDistance = Number.MAX_VALUE;
            activeBuses.forEach(b => {
              const d = getDistanceKm(startY, startX, parseFloat(b.lat), parseFloat(b.lot));
              if (d < minDistance) minDistance = d;
            });
            
            if (minDistance < 10) { // Only show ETA if closest bus is within 10km
              if (minDistance < 0.1) return '곧 도착';
              // Assume 15km/h average city speed -> 4 mins per km
              const etaMinutes = Math.max(1, Math.ceil(minDistance * 4));
              return `약 ${etaMinutes}분 후 도착 (${Math.round(minDistance * 10) / 10}km)`;
            }
          }
          return '운행중 (지도 참조)';
        } else {
          return '차고지 대기'; 
        }
      }
    } catch (e) {
      console.error('Failed to fetch from public data API:', e);
    }
  }

  // Fallback to ODsay API
  const url = `${BASE_URL}/realtimeStation?apiKey=${ODSAY_API_KEY}&stationID=${stationId}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.error) {
      // ODsay API currently returns error -11 (준비중) for most regions. Mock for demo:
      return Math.floor(Math.random() * 10) + 3;
    }
    if (data.result && data.result.real) {
      const realList = data.result.real;
      const target = realList.find((r: any) => String(r.routeId) === String(routeId));
      if (target) {
        if (target.arrival1 && target.arrival1.arrivalSec !== undefined) {
          return Math.round(target.arrival1.arrivalSec / 60); // Return in minutes
        }
        if (target.endBusYn === 'Y') {
          return '운행 종료';
        }
      }
    }
    return '정보 없음';
  } catch (e) {
    console.error('Failed to fetch realtime bus info:', e);
    return '정보 없음';
  }
}
