export type TransportType = 'WALK' | 'BUS' | 'SUBWAY';

export interface RoutePathStep {
  id: string;
  type: TransportType;
  instruction: string;
  durationMinutes: number;
  distanceMeters?: number;
  
  // Only for transit
  lineName?: string;
  lineColor?: string;
  startStation?: string;
  endStation?: string;
  stationCount?: number;
  pathCoords?: [number, number][]; // [lat, lng] array for drawing polyline
  startStationId?: number; // For ODsay real-time API
  routeId?: number; // For ODsay real-time API
  localRouteId?: string; // Local public data route ID
  cityCode?: number; // Local city code
}

export interface RouteOption {
  id: string;
  totalTimeMinutes: number;
  totalFare: number;
  transferCount: number;
  steps: RoutePathStep[];
  tags: string[];
}
