import { incidentRepository } from '../repositories/incidentRepository.js';
import { geocodingService } from './geocodingService.js';
import { getReadableLocation } from './landmarkService.js';
import { broadcastNewIncident, broadcastIncidentUpdated, broadcastIncidentExpired } from '../sockets/socketHandler.js';
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

  // Bounding box couvrant toute la région Île-de-France (Paris + 92 + 93 + 94 + 78 + 91 + 95 + 77)
  private readonly bbox = {
    x1: 1.44,  // Ouest (Yvelines / Mantes / Houdan)
    y1: 49.25, // Nord (Val-d'Oise / Roissy / Persan)
    x2: 3.56,  // Est (Seine-et-Marne / Meaux / Provins)
    y2: 48.12, // Sud (Essonne / Fontainebleau / Nemours)
  };

  constructor() {
    console.log('📡 [MediaManif OSINT] Service de synchronisation citoyenne initialisé');
  }

  /**
   * Récupère les points en direct depuis l'endpoint JSON de MediaManif
   */
  async fetchPoints(): Promise<RawMediaManifPoint[]> {
    const url = `https://mediamanif.org/getter.php?what=points&zoom=10&x1=${this.bbox.x1}&y1=${this.bbox.y1}&x2=${this.bbox.x2}&y2=${this.bbox.y2}&showgreve=1`;

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
   * Détermine la sévérité (Rouge / Jaune / Vert), catégorie et émoji selon le code `what` de MediaManif
   */
  private mapMediaManifCategory(what: string): {
    severity: Severity;
    category: IncidentCategory;
    description: string;
  } {
    switch (what) {
      case '7': // Danger / Dégradations / Affrontement (Rouge)
        return {
          severity: 'danger',
          category: 'degradation',
          description: '🔥 [Danger] Affrontements ou dégradations signalés en direct via MediaManif.',
        };
      case '11': // Lacrymogènes (Rouge)
        return {
          severity: 'danger',
          category: 'tension',
          description: '💨 [Lacrymo] Usage de gaz lacrymogènes signalé via MediaManif.',
        };
      case '13': // Forces de l'ordre / Police / CRS (Jaune/Orange)
        return {
          severity: 'warning',
          category: 'tension',
          description: '👮 [Police / CRS] Dispositif ou filtrage des forces de l\'ordre (MediaManif).',
        };
      case '8': // Manifestants < 100
      case '9': // Manifestants < 1000
      case '10': // Manifestants > 1000 (Jaune/Orange)
        return {
          severity: 'warning',
          category: 'manifestation',
          description: '📢 [Cortège] Déplacement de manifestants signalé via MediaManif.',
        };
      case '14':
      case '15': // Lieu de rassemblement / Grève (Jaune/Orange)
        return {
          severity: 'warning',
          category: 'manifestation',
          description: '🪧 [Mobilisation] Point de rassemblement citoyen signalé (MediaManif).',
        };
      case '1':
      case 'safe': // Calme / Zone Safe (Vert)
        return {
          severity: 'safe',
          category: 'calme',
          description: '🟢 [Zone Calme] Secteur fluide et sécurisé (MediaManif).',
        };
      default:
        return {
          severity: 'warning',
          category: 'autre',
          description: '⚠️ [Vigilance] Événement de rue signalé en direct via MediaManif.',
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

        // 1. Filtrage géographique sur l'ensemble de la région Île-de-France (Paris + couronne)
        const isInsideIdfArea =
          lat >= this.bbox.y2 &&
          lat <= this.bbox.y1 &&
          lng >= this.bbox.x1 &&
          lng <= this.bbox.x2;

        if (!isInsideIdfArea) continue;
        parisCount++;

        // 2. Filtre de fraîcheur stricte : uniquement les points en direct récents (< 30 minutes, fini les 120min)
        if (isOld || ageSec > 1800) {
          continue;
        }

        // 3. Mapping de classification
        const mapping = this.mapMediaManifCategory(pt.what);

        // 4. Reverse-geocoding via BAN ou association automatique au repère parisien le plus proche
        let addressName = getReadableLocation(lat, lng);
        try {
          const banAddress = await geocodingService.reverseGeocode(lat, lng);
          addressName = getReadableLocation(lat, lng, banAddress);
        } catch {
          addressName = getReadableLocation(lat, lng);
        }

        // 5. Ingestion avec clustering et TTL dynamique plafonné à 30 min max (1800s)
        const remainingTtlSec = Math.max(300, 1800 - ageSec);
        const { incident, isClusterMerge } = await incidentRepository.processIncidentReport({
          lat,
          lng,
          location_name: addressName,
          severity: mapping.severity,
          category: mapping.category,
          description: mapping.description,
          source: `MediaManif #${pt.id} (mediamanif.org)`,
          ttlSeconds: remainingTtlSec,
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

      // Fusion consolidée de tous les périmètres qui se croisent à plus de 50%
      const { mergedCount } = await incidentRepository.mergeAllOverlappingIncidents(0.50);
      if (mergedCount > 0) {
        clusteredMerged += mergedCount;
      }

      // 6. RÈGLE STRICTE : Si un point MediaManif a disparu du flux MediaManif OU dépasse 30 minutes -> SUPPRIMÉ IMMÉDIATEMENT !
      const liveMediaManifIds = new Set(rawPoints.map((p) => String(p.id)));
      const allIncidents = await incidentRepository.getAll({ limit: 1000 });
      const nowMs = Date.now();
      const maxAgeMs = 30 * 60 * 1000; // 30 minutes max au lieu de 120min
      let expiredMediaManifCount = 0;

      for (const inc of allIncidents) {
        if (inc.source && inc.source.includes('MediaManif')) {
          const idMatch = inc.source.match(/MediaManif\s*#(\d+)/i);
          const mmId = idMatch ? idMatch[1] : null;

          // Disparu du nouveau fetch OU plus de 30 minutes écoulées
          const isDisappearedFromMediaManif = mmId ? !liveMediaManifIds.has(mmId) : false;
          const ageMs = nowMs - new Date(inc.created_at).getTime();
          const isOverMaxAge = ageMs >= maxAgeMs || new Date(inc.expires_at).getTime() <= nowMs;

          if (isDisappearedFromMediaManif || isOverMaxAge) {
            await incidentRepository.deleteById(inc.id);
            broadcastIncidentExpired(inc.id);
            expiredMediaManifCount++;
            console.log(
              `🧹 [MediaManif Sync] Signalement [${inc.id}] retiré immédiatement (${
                isDisappearedFromMediaManif ? 'disparu du flux MediaManif' : 'durée > 30min dépassée'
              })`
            );
          }
        }
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

    console.log(`🤖 [MediaManif Cron] Tâche automatisée activée (toutes les ${intervalMinutes} min)`);

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
