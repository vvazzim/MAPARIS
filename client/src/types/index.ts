export type Severity = 'danger' | 'warning' | 'safe';

export type IncidentCategory = 
  | 'manifestation' 
  | 'blocage' 
  | 'tension' 
  | 'fermeture_station' 
  | 'degradation' 
  | 'calme'
  | 'autre';

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  location_name: string;
  severity: Severity;
  category?: IncidentCategory;
  description: string;
  source: string;
  reports_count?: number;
  upvotes: number;
  downvotes?: number;
  reliability_score?: number;
  expires_at?: string;
  verified?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface RealtimeDeparture {
  line: string;
  destination: string;
  remainingMinutes: number;
  remainingDisplay: string; // e.g. "À l'approche", "1 min", "3 min"
  followingDisplay?: string; // e.g. "5 min"
  isRealtime: boolean;
  status: 'on_time' | 'delayed' | 'disrupted';
}

export interface MetroStationStatus {
  id: string;
  name: string;
  lines: string[];
  status: 'normal' | 'disrupted' | 'closed';
  incident_desc?: string;
  lat: number;
  lng: number;
  departures?: RealtimeDeparture[];
}

export interface FilterOptions {
  severity: 'all' | Severity;
  minUpvotes: number;
  searchQuery: string;
}

export interface RouteHazard {
  id: string;
  location_name: string;
  severity: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export interface SafeRouteResult {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  directPath: [number, number][];
  safePath: [number, number][];
  alternativePaths?: [number, number][][];
  directDistanceKm: number;
  safeDistanceKm: number;
  directDurationMin: number;
  safeDurationMin: number;
  hazardsAvoided: RouteHazard[];
  hazardsIntersectedByDirect: RouteHazard[];
  safetyScore: number;
  recommendation: string;
}
