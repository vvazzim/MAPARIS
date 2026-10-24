import { env } from '../config/env.js';
import { GeocodeResult } from '../types/index.js';
import { getReadableLocation } from './landmarkService.js';

interface BANFeature {
  type: string;
  geometry: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    label: string;
    score: number;
    housenumber?: string;
    id?: string;
    name?: string;
    postcode?: string;
    citycode?: string;
    city?: string;
    context?: string;
    type?: string;
    street?: string;
  };
}

interface BANResponse {
  type: string;
  version: string;
  features: BANFeature[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
}

export class GeocodingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.BAN_API_URL || 'https://api-adresse.data.gouv.fr';
  }

  /**
   * Géocode une adresse ou un lieu en Île-de-France (Paris, 92, 93, 94, etc.) en coordonnées GPS (lat, lng)
   * Utilise l'API Base Adresse Nationale (BAN) avec priorité géographique sur toute la région IDF.
   */
  async geocodeAddress(query: string): Promise<GeocodeResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error("L'adresse fournie pour le géocodage est vide.");
    }

    // Détecte si la recherche mentionne déjà Paris, un département IDF (75, 77, 78, 91, 92, 93, 94, 95) ou une commune
    const hasIdfContext = /(?:paris|75\d{3}|92\d{3}|93\d{3}|94\d{3}|77\d{3}|78\d{3}|91\d{3}|95\d{3}|île-de-france|idf|seine|hauts-de-seine|val-de-marne|yvelines|essonne)/i.test(trimmed);
    const searchTarget = hasIdfContext ? trimmed : `${trimmed}, Île-de-France`;

    // lat=48.8566 & lon=2.3522 donne une priorité géographique au centre de l'agglomération parisienne et IDF
    const url = new URL(`${this.baseUrl}/search/`);
    url.searchParams.append('q', searchTarget);
    url.searchParams.append('limit', '5');
    url.searchParams.append('lat', '48.8566');
    url.searchParams.append('lon', '2.3522');

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ParisSecurityPulse/1.0',
        },
        signal: AbortSignal.timeout(5000), // 5 secondes timeout max
      });

      if (!response.ok) {
        throw new Error(`Erreur API BAN: HTTP ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as BANResponse;

      if (!data.features || data.features.length === 0) {
        // Fallback sécurisé : Coordonnées approximatives de Paris
        console.warn(`[Geocoding] Aucun résultat BAN pour "${trimmed}". Utilisation du fallback Paris.`);
        return {
          lat: 48.8566,
          lng: 2.3522,
          label: `${trimmed} (Localisation approximative Paris)`,
          score: 0.1,
          city: 'Paris',
          postcode: '75001',
        };
      }

      // GeoJSON retourne [longitude, latitude]
      const bestFeature = data.features[0];
      const [lng, lat] = bestFeature.geometry.coordinates;

      return {
        lat,
        lng,
        label: bestFeature.properties.label,
        score: bestFeature.properties.score,
        postcode: bestFeature.properties.postcode,
        city: bestFeature.properties.city,
        context: bestFeature.properties.context,
      };
    } catch (error: any) {
      console.error(`[Geocoding] Échec de la requête vers BAN pour "${trimmed}":`, error.message);
      
      // Fallback par défaut sur Paris pour éviter de bloquer l'incident
      return {
        lat: 48.8566,
        lng: 2.3522,
        label: `${trimmed} (Non géocodé - centre Paris)`,
        score: 0,
        city: 'Paris',
      };
    }
  }

  /**
   * Recherche multiple d'adresses pour l'autocomplétion côté frontend
   */
  async searchAddresses(query: string, limit: number = 5): Promise<GeocodeResult[]> {
    if (!query || query.trim().length < 2) return [];

    const url = new URL(`${this.baseUrl}/search/`);
    url.searchParams.append('q', query);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('lat', '48.8566');
    url.searchParams.append('lon', '2.3522');

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) return [];

      const data = (await response.json()) as BANResponse;

      return (data.features || []).map((f) => ({
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        label: f.properties.label,
        score: f.properties.score,
        postcode: f.properties.postcode,
        city: f.properties.city,
        context: f.properties.context,
      }));
    } catch (err: any) {
      console.error('[Geocoding] Erreur autocomplétion:', err.message);
      return [];
    }
  }

  /**
   * Géocodage inverse : Coordonnées lat/lng vers libellé d'adresse
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const url = new URL(`${this.baseUrl}/reverse/`);
    url.searchParams.append('lat', lat.toString());
    url.searchParams.append('lon', lng.toString());

    try {
      const response = await fetch(url.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });

      if (!response.ok) return getReadableLocation(lat, lng);

      const data = (await response.json()) as BANResponse;
      if (data.features && data.features.length > 0) {
        return data.features[0].properties.label;
      }
      return getReadableLocation(lat, lng);
    } catch {
      return getReadableLocation(lat, lng);
    }
  }
}

export const geocodingService = new GeocodingService();
