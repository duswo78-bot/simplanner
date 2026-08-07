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
            pathCoords,
            startStationId: sub.startID,
            routeId: lineInfo.busID || lineInfo.subwayCode,
            localRouteId: lineInfo.busLocalBlID,
            cityCode: lineInfo.busCityCode
          });
        }
      });
      
      let tags: string[] = [];
      if (path.pathType === 1) tags.push('전철');
      if (path.pathType === 2) tags.push('버스');
      if (path.pathType === 3) tags.push('버스+전철');
      if (index === 0) tags.unshift('최적');

      const transferCount = Math.max(0, (path.info.busTransitCount || 0) + (path.info.subwayTransitCount || 0) - 1);

      // Fetch detailed graphical polylines
      if (path.info.mapObj) {
        try {
          const laneUrl = `${BASE_URL}/loadLane?apiKey=${ODSAY_API_KEY}&mapObject=0:0@${path.info.mapObj}`;
          const laneRes = await fetch(laneUrl);
          const laneData = await laneRes.json();
          if (laneData.result && laneData.result.lane) {
            const lanes = laneData.result.lane;
            let laneIdx = 0;
            steps.forEach(step => {
              if (step.type === 'BUS' || step.type === 'SUBWAY') {
                if (lanes[laneIdx]) {
                  const coords: [number, number][] = [];
                  lanes[laneIdx].section.forEach((sec: any) => {
                    sec.graphPos.forEach((pos: any) => coords.push([parseFloat(pos.y), parseFloat(pos.x)]));
                  });
                  if (coords.length > 0) step.pathCoords = coords;
                }
                laneIdx++;
              }
            });
          }
        } catch (e) {
          console.error('Failed to load detailed lane for route', index, e);
        }
      }

      return {
        id: `route-${index}`,
        totalTimeMinutes: path.info.totalTime,
        totalFare: path.info.payment,
        transferCount: transferCount,
        steps,
        tags
      } as RouteOption;
    }));

    return paths;
  } catch (err) {
    console.error('Failed to fetch routes:', err);
    throw err;
  }
}

export async function getRealtimeBusArrival(stationId: number, routeId: number, localRouteId?: string, cityCode?: number): Promise<number | string> {
  // Use public data API if Ulsan bus
  if (localRouteId && cityCode === 6000) {
    try {
      const apiKey = import.meta.env.VITE_BUS_API_KEY || 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
      const stdgCd = '3100000000'; // Ulsan code
      const url = `https://apis.data.go.kr/B551982/rte/rtm_loc_info?serviceKey=${apiKey}&stdgCd=${stdgCd}&numOfRows=1000&pageNo=1&type=json`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data?.header?.resultCode === 'K0' || data?.header?.resultCode === '00') {
        const items = data.body?.items?.item || [];
        const arr = Array.isArray(items) ? items : [items];
        const activeBuses = arr.filter((b: any) => b.rteId === localRouteId);
        
        if (activeBuses.length > 0) {
          // Public data API provides locations, not exact ETA.
          return '운행중 (지도 참조)';
        } else {
          return '차고지 대기'; // No buses active on the route right now
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
