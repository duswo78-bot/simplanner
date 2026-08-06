import type { POI } from './OdsayApi';

// VWorld API Key (Need user to provide this in .env or hardcode)
const VWORLD_API_KEY = import.meta.env.VITE_VWORLD_API_KEY || '4C6A8179-E902-3F04-AE87-921B4F141914';

function fetchJsonp(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = 'vworld_cb_' + Math.round(1000000 * Math.random());
    const script = document.createElement('script');
    
    // Ensure URL has no existing callback param
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${callbackName}`;
    
    (window as any)[callbackName] = (data: any) => {
      resolve(data);
      document.head.removeChild(script);
      delete (window as any)[callbackName];
    };
    
    script.onerror = () => {
      reject(new Error('JSONP Request Failed'));
      document.head.removeChild(script);
      delete (window as any)[callbackName];
    };
    
    document.head.appendChild(script);
  });
}

export async function searchPlaces(keyword: string): Promise<POI[]> {
  if (!keyword) return [];
  
  // VWorld Search API (search type: PLACE)
  const url = `https://api.vworld.kr/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=10&page=1&query=${encodeURIComponent(keyword)}&type=PLACE&format=json&errorformat=json&key=${VWORLD_API_KEY}`;
  
  try {
    const data = await fetchJsonp(url);
    
    if (data.response?.status === 'OK' && data.response?.result?.items) {
      const items = data.response.result.items;
      return items.map((item: any) => ({
        id: item.id,
        name: item.title,
        x: parseFloat(item.point.x),
        y: parseFloat(item.point.y),
        address: item.address?.road || item.address?.parcel || ''
      }));
    } else if (data.response?.status === 'ERROR') {
      console.warn('VWorld API Error:', data.response.error?.text);
      return [];
    }
    
    return [];
  } catch (err) {
    console.error('Failed to fetch VWorld POI:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0&crs=epsg:4326&point=${lng},${lat}&format=json&type=BOTH&zipcode=true&simple=false&key=${VWORLD_API_KEY}`;
  
  try {
    const data = await fetchJsonp(url);
    
    if (data.response?.status === 'OK' && data.response?.result?.length > 0) {
      return data.response.result[0].text;
    }
  } catch (err) {
    console.error('Failed to reverse geocode:', err);
  }
  return '지도 선택 위치';
}
