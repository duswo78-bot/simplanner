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
}

export interface RouteOption {
  id: string;
  totalTimeMinutes: number;
  totalFare: number;
  transferCount: number;
  steps: RoutePathStep[];
  tags: string[];
}
