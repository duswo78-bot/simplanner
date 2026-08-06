import type { RouteOption, RoutePathStep } from './RouteTypes';

const ODSAY_API_KEY = 'hBtPWXmpbhuZ5cOCZJjiQw'; // For demo. In prod use env var.
const BASE_URL = '/api/odsay/v1/api';

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

    const paths = data.result.path.map((path: any, index: number) => {
      
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

            steps.push({
              id: `w-${index}-${subIdx}`,
              type: 'WALK',
              instruction: `도보 이동 (${walkStart} ➔ ${walkEnd})`,
              durationMinutes: sub.sectionTime,
              distanceMeters: sub.distance
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

          steps.push({
            id: `t-${index}-${subIdx}`,
            type: isSubway ? 'SUBWAY' : 'BUS',
            instruction: `${lineInfo.name || lineInfo.busNo || '교통수단'} 탑승`,
            durationMinutes: sub.sectionTime || 0,
            distanceMeters: sub.distance || 0,
            lineName: lineInfo.name || lineInfo.busNo || '노선 정보 없음',
            lineColor: lineInfo.type === 1 ? '#0052A4' : lineInfo.type === 2 ? '#00A84D' : lineInfo.type === 3 ? '#EF7C1C' : lineInfo.type === 4 ? '#00A5DE' : '#3b82f6', 
            startStation: sub.startName || '출발 정류장',
            endStation: sub.endName || '도착 정류장',
            stationCount: sub.stationCount || 0,
            pathCoords
          });
        }
      });
      
      let tags: string[] = [];
      if (path.pathType === 1) tags.push('지하철');
      if (path.pathType === 2) tags.push('버스');
      if (path.pathType === 3) tags.push('버스+지하철');
      if (index === 0) tags.unshift('최적');

      const transferCount = Math.max(0, (path.info.busTransitCount || 0) + (path.info.subwayTransitCount || 0) - 1);

      return {
        id: `route-${index}`,
        totalTimeMinutes: path.info.totalTime,
        totalFare: path.info.payment,
        transferCount: transferCount,
        steps,
        tags
      } as RouteOption;
    });

    return paths;
  } catch (err) {
    console.error('Failed to fetch routes:', err);
    throw err;
  }
}
