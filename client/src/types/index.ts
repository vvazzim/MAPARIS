export type Severity = 'danger' | 'warning' | 'safe';

export type IncidentCategory = 
  | 'manifestation' 
  | 'blocage' 
  | 'tension' 
  | 'fermeture_station' 
  | 'arret_perturbe'
  | 'greve_retard'
  | 'controleurs'
  | 'degradation' 
  | 'calme'
  | 'autre';

export interface PinnedTransitStop {
  id: string; // unique pin id
  lineKey: string;
  stopName: string;
  stopId: string;
  direction: string;
  directionCode?: string;
  hubId?: string;
  addedAt: number;
}

export interface ControllerReportData {
  stationName: string;
  lineKey: string;
  direction?: string;
  locationDetail: 'turnstiles' | 'platform' | 'train' | 'hall';
  agentsCount?: string;
  description?: string;
}

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
  duration?: IncidentDurationType;
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

export type WidgetTheme = 'glass' | 'oled' | 'neon' | 'classic';
export type WidgetDensity = 'compact' | 'standard' | 'ticker';
export type WidgetLocationMode = 'gps' | 'station';

export interface CustomWidgetLineItem {
  id: string;
  lineKey: string;
  stopName: string;
  stopId: string;
  direction: string;
  directionCode?: string;
  customLabel?: string;
}

export interface CustomWidgetConfig {
  enabled: boolean;
  dockPosition: 'bottom' | 'top' | 'floating';
  theme: WidgetTheme;
  density: WidgetDensity;
  locationMode: WidgetLocationMode;
  selectedStationId?: string;
  selectedStationName?: string;
  lines: CustomWidgetLineItem[];
}

export type IncidentDurationType = '2h' | '12h' | '2d';
