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

export interface Incident {
  id: string;
  lat: number;
  lng: number;
  lon?: number;
  location_name: string;
  severity: Severity;
  category?: IncidentCategory;
  description: string;
  source: string;
  reports_count: number;
  upvotes: number;
  downvotes: number;
  reliability_score: number;
  expires_at: string;
  created_at: string;
  updated_at?: string;
  resolved?: boolean;
  duration?: '2h' | '12h' | '2d';
}

export interface CreateIncidentDTO {
  address: string;
  severity: Severity;
  description: string;
  source?: string;
  category?: IncidentCategory;
  lat?: number;
  lng?: number;
  duration?: '2h' | '12h' | '2d';
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
  score: number;
  postcode?: string;
  city?: string;
  context?: string;
}

export interface IncidentQueryFilters {
  severity?: Severity;
  limit?: number;
  since?: string;
}
