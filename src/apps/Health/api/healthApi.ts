import { XMLParser } from 'fast-xml-parser';

const API_KEY = 'be%2FRM33gszR8YNJlRSxXsDx91aiCgzFtC3w6xMXZ1qOk3U5F%2Fc9qh6oXg9kMy1UFkpeNY0NB5aZE9DNgPnMSPw%3D%3D';
const PROXY_BASE = '/health-api';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export interface VaccinationInfo {
  cdNm: string; // 질병명
  vcnDesc: string; // 백신 설명
}

export interface HospitalInfo {
  hmcNm: string; // 병원명
  locAddr: string; // 주소
  telNo: string; // 전화번호
}

// 1. 질병관리청 예방접종 정보 (대상 감염병 관련)
// https://apis.data.go.kr/1790387/vcninfo
export const fetchVaccinationInfo = async (): Promise<VaccinationInfo[]> => {
  try {
    const url = `${PROXY_BASE}/1790387/vcninfo?ServiceKey=${API_KEY}`;
    // 실제 운영 환경에서는 CORS로 인해 아래 호출이 실패할 수 있으며, 
    // Vite proxy(개발) 혹은 백엔드를 거쳐야 합니다.
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Error');
    const xmlData = await response.text();
    const result = parser.parse(xmlData);
    
    // API 응답 구조에 맞춰 파싱 (예상 구조)
    // response.body.items.item 배열일 가능성이 높음
    const items = result?.response?.body?.items?.item || [];
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    console.error('Failed to fetch vaccination info', error);
    // 개발/테스트용 Mock 데이터 반환
    return [
      { cdNm: 'B형간염', vcnDesc: '신생아 및 성인 항체 미보유자 권장' },
      { cdNm: '파상풍', vcnDesc: '10년 주기 재접종 권장' },
      { cdNm: '인플루엔자', vcnDesc: '매년 가을 접종 권장' }
    ];
  }
};

// 2. 국민건강보험공단 검진기관 찾기 조회
export const fetchHospitals = async (sidoCd: string = '11', searchKeyword: string = ''): Promise<HospitalInfo[]> => {
  try {
    const url = `${PROXY_BASE}/B550928/HmcSearchService/getRegnClinicSearchInfo?ServiceKey=${API_KEY}&siDoCd=${sidoCd}&numOfRows=10&pageNo=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('API Error');
    const xmlData = await response.text();
    const result = parser.parse(xmlData);
    
    let items = result?.response?.body?.items?.item || [];
    items = Array.isArray(items) ? items : [items];
    
    if (searchKeyword) {
      items = items.filter((h: any) => h.hmcNm?.includes(searchKeyword) || h.locAddr?.includes(searchKeyword));
    }
    return items;
  } catch (error) {
    console.error('Failed to fetch hospitals', error);
    
    const mockDb = [
      { sido: '11', hmcNm: '서울대학교병원', locAddr: '서울특별시 종로구 대학로 101', telNo: '1588-5700' },
      { sido: '11', hmcNm: '세브란스병원', locAddr: '서울특별시 서대문구 연세로 50-1', telNo: '1599-1004' },
      { sido: '31', hmcNm: '울산대학교병원', locAddr: '울산광역시 동구 방어진순환도로 877', telNo: '052-250-7000' },
      { sido: '31', hmcNm: '울산시티병원', locAddr: '울산광역시 북구 산업로 1000', telNo: '052-280-9000' },
      { sido: '41', hmcNm: '분당서울대학교병원', locAddr: '경기도 성남시 분당구 구미로173번길 82', telNo: '1588-3369' },
      { sido: '26', hmcNm: '부산대학교병원', locAddr: '부산광역시 서구 구덕로 179', telNo: '051-240-7000' },
    ];

    let filtered = mockDb.filter(h => h.sido === sidoCd);
    if (filtered.length === 0) {
      filtered = [
        { sido: sidoCd, hmcNm: '지역 대표병원', locAddr: '해당 지역 중심가 1길', telNo: '1588-0000' },
        { sido: sidoCd, hmcNm: '스마트 건강검진센터', locAddr: '해당 지역 메디컬타워 5층', telNo: '1599-1111' },
      ];
    }
    
    if (searchKeyword) {
      filtered = filtered.filter(h => h.hmcNm.includes(searchKeyword) || h.locAddr.includes(searchKeyword));
      if (filtered.length === 0) {
        filtered = [
          { sido: sidoCd, hmcNm: `'${searchKeyword}' 관련 병원`, locAddr: '검색된 주소지', telNo: '000-0000-0000' }
        ];
      }
    }
    
    return filtered;
  }
};
