import { incidentRepository } from '../repositories/incidentRepository.js';
import { geocodingService } from './geocodingService.js';
import { broadcastNewIncident, broadcastIncidentUpdated } from '../sockets/socketHandler.js';
import { Severity, IncidentCategory, Incident } from '../types/index.js';

export interface RawMediaManifPoint {
  id: string;
  login?: string;
  what: string;       // Catégorie : "7" Danger, "11" Lacrymo, "13" Police, "8"/"9"/"10" Manifestants, "15" Rassemblement
  trust?: string;
  age: string;        // Âge en secondes
  confirms?: string;
  old: string | number; // "0" pour récent/en direct, "1" pour plus ancien
  lon: string;
  lat: string;
  attributes?: any;
}

export interface MediaManifSyncResult {
  success: boolean;
  totalFetched: number;
  parisFiltered: number;
  newCreated: number;
  clusteredMerged: number;
  incidents: Incident[];
  timestamp: string;
  error?: string;
}

export class MediaManifService {
  private isPollingActive: boolean = false;
  private pollIntervalTimer: NodeJS.Timeout | null = null;
  private lastSyncTime: string | null = null;
  private lastResult: MediaManifSyncResult | null = null;
  private processedIds: Set<string> = new Set();

  // Bounding box élargie couvrant Paris intramuros et proche couronne
  private readonly bbox = {
    x1: 2.22,  // Ouest
    y1: 48.92, // Nord
    x2: 2.48,  // Est
    y2: 48.80, // Sud
  };

  constructor() {
    console.log('📡 [MediaManif OSINT] Service de synchronisation citoyenne initialisé');
  }

  /**
   * Récupère les points en direct depuis l'endpoint JSON de MediaManif
   */
  async fetchPoints(): Promise<RawMediaManifPoint[]> {
    const url = `https://mediamanif.org/getter.php?what=points&zoom=13&x1=${this.bbox.x1}&y1=${this.bbox.y1}&x2=${this.bbox.x2}&y2=${this.bbox.y2}&showgreve=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Referer': 'https://mediamanif.org/',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(10000), // 10 secondes timeout max
    });

    if (!response.ok) {
      throw new Error(`MediaManif HTTP ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    if (!Array.isArray(json)) {
      console.warn('⚠️ [MediaManif] Réponse non-tableau reçue:', typeof json);
      return [];
    }

    return json as RawMediaManifPoint[];
  }

  /**
   * Détermine la sévérité, catégorie et description textuelle selon le code `what` de MediaManif
   */
  private mapMediaManifCategory(what: string): {
    severity: Severity;
    category: IncidentCategory;
    description: string;
  } {
    switch (what) {
      case '7': // Danger
        return {
          severity: 'danger',
          category: 'tension',
          description: '[Danger] Zone à risque signalée en direct via MediaManif.',
        };
      case '11': // Lacrymogènes
        return {
          severity: 'danger',
          category: 'tension',
          description: '[Lacrymo] Usage de gaz lacrymogènes signalé via MediaManif.',
        };
      case '13': // Forces de l'ordre
        return {
          severity: 'warning',
          category: 'tension',
          description: '[Police / CRS] Dispositif ou filtrage des forces de l\'ordre (MediaManif).',
        };
      case '8': // Manifestants < 100
      case '9': // Manifestants < 1000
      case '10': // Manifestants > 1000
        return {
          severity: 'warning',
          category: 'manifestation',
          description: '[Cortège] Déplacement de manifestants signalé via MediaManif.',
        };
      case '14':
      case '15': // Lieu de rassemblement / Grève
        return {
          severity: 'warning',
          category: 'manifestation',
          description: '[Mobilisation] Point de rassemblement citoyen signalé (MediaManif).',
        };
      default:
        return {
          severity: 'warning',
          category: 'autre',
          description: '[Vigilance] Événement de rue signalé en direct via MediaManif.',
        };
    }
  }

  /**
   * Cycle de synchronisation complet :
   * 1. Requête HTTP vers getter.php?what=points
   * 2. Filtrage géographique strict sur Paris
   * 3. Filtrage de fraîcheur (points récents uniquement)
   * 4. Reverse-geocodage d'adresse via l'API BAN
   * 5. Clustering géospatial à 50m & TTL dynamique 1h
   * 6. Sauvegarde Supabase & diffusion Socket.io en direct
   */
  async syncNow(): Promise<MediaManifSyncResult> {
    const timestamp = new Date().toISOString();
    console.log(`📡 [MediaManif] Lancement de la synchronisation horaire...`);

    try {
      const rawPoints = await this.fetchPoints();
      const incidentsResult: Incident[] = [];
      let parisCount = 0;
      let newCreated = 0;
      let clusteredMerged = 0;

      for (const pt of rawPoints) {
        const lat = parseFloat(pt.lat);
        const lng = parseFloat(pt.lon);
        const ageSec = parseInt(pt.age || '0', 10);
        const isOld = pt.old === '1' || pt.old === 1;

        // 1. Filtrage géographique strict sur la zone de Paris
        const isInsideParisArea =
          lat >= this.bbox.y2 &&
          lat <= this.bbox.y1 &&
          lng >= this.bbox.x1 &&
          lng <= this.bbox.x2;

        if (!isInsideParisArea) continue;
        parisCount++;

        // 2. Filtre de fraîcheur : priorité aux points en direct (old=0) ou de moins de 2 heures
        if (isOld && ageSec > 7200) {
          continue;
        }

        // 3. Mapping de classification
        const mapping = this.mapMediaManifCategory(pt.what);

        // 4. Reverse-geocoding via BAN pour obtenir le nom de rue précis
        let addressName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        try {
          addressName = await geocodingService.reverseGeocode(lat, lng);
        } catch {
          addressName = `Secteur Paris (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }

        // 5. Ingestion avec notre logique de clustering à 50m et TTL dynamique 1h
        const { incident, isClusterMerge } = await incidentRepository.processIncidentReport({
          lat,
          lng,
          location_name: addressName,
          severity: mapping.severity,
          category: mapping.category,
          description: mapping.description,
          source: 'MediaManif Citoyen (mediamanif.org)',
        });

        incidentsResult.push(incident);

        if (isClusterMerge) {
          clusteredMerged++;
          broadcastIncidentUpdated(incident);
        } else {
          newCreated++;
          broadcastNewIncident(incident);
        }

        this.processedIds.add(pt.id);
      }

      console.log(`✅ [MediaManif] Sync réussie : ${rawPoints.length} points bruts, ${parisCount} à Paris, ${newCreated} créés, ${clusteredMerged} fusionnés.`);

      const result: MediaManifSyncResult = {
        success: true,
        totalFetched: rawPoints.length,
        parisFiltered: parisCount,
        newCreated,
        clusteredMerged,
        incidents: incidentsResult,
        timestamp,
      };

      this.lastSyncTime = timestamp;
      this.lastResult = result;
      return result;
    } catch (err: any) {
      console.error('❌ [MediaManif] Erreur synchronisation:', err.message);
      const failResult: MediaManifSyncResult = {
        success: false,
        totalFetched: 0,
        parisFiltered: 0,
        newCreated: 0,
        clusteredMerged: 0,
        incidents: [],
        timestamp,
        error: err.message,
      };
      this.lastResult = failResult;
      return failResult;
    }
  }

  /**
   * Démarre la synchronisation automatisée en tâche de fond (cron toutes les heures par défaut)
   */
  startPolling(intervalMinutes: number = 60) {
    if (this.isPollingActive) return;
    this.isPollingActive = true;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🤖 [MediaManif Cron] Tâche automatisée activée (toutes les ${intervalMinutes}h)`);

    // Première synchronisation différée de 5 secondes après le démarrage du serveur
    setTimeout(() => {
      this.syncNow().catch(() => {});
    }, 5000);

    // Boucle périodique horaire
    this.pollIntervalTimer = setInterval(() => {
      this.syncNow().catch((err) => {
        console.warn('⚠️ [MediaManif Cron] Erreur cycle périodique:', err.message);
      });
    }, intervalMs);
  }

  /**
   * Arrête la synchronisation automatique
   */
  stopPolling() {
    if (this.pollIntervalTimer) {
      clearInterval(this.pollIntervalTimer);
      this.pollIntervalTimer = null;
    }
    this.isPollingActive = false;
    console.log('🛑 [MediaManif Cron] Tâche automatisée arrêtée.');
  }

  getStatus() {
    return {
      active: this.isPollingActive,
      intervalHours: 1,
      lastSyncTime: this.lastSyncTime,
      lastResult: this.lastResult,
      processedCount: this.processedIds.size,
    };
  }
}

export const mediaManifService = new MediaManifService();
