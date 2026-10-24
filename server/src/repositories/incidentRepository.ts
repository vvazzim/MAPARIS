import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { Incident, IncidentQueryFilters, Severity } from '../types/index.js';

/**
 * Calcul précis de distance orthodromique (Haversine) en mètres
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Rayon moyen de la Terre en mètres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class IncidentRepository {
  private inMemoryCache: Map<string, Incident> = new Map();
  private storagePath: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.storagePath = path.resolve(process.cwd(), 'data', 'incidents.json');
    this.init();
    this.startAutoCleanup(30000); // Nettoyage automatique toutes les 30 secondes
  }

  private async init() {
    // Si Supabase est actif, charge les données actives depuis Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase
          .from('incidents')
          .select('*')
          .gt('expires_at', new Date().toISOString());

        if (!error && data) {
          const maxAgeMs = 12 * 3600 * 1000;
          const nowMs = Date.now();
          data.forEach((row: any) => {
            const inc = this.mapSupabaseRowToIncident(row);
            const ageMs = nowMs - new Date(inc.created_at).getTime();
            // N'ingère en mémoire que les signalements récents (<12h) et valides
            if (ageMs <= maxAgeMs && !inc.resolved) {
              this.inMemoryCache.set(inc.id, inc);
            }
          });
          console.log(`⚡ [Supabase] ${this.inMemoryCache.size} incidents récents synchronisés`);
          return;
        }
      } catch (err: any) {
        console.warn('⚠️ [IncidentRepo] Erreur chargement Supabase, fallback fichier:', err.message);
      }
    }

    // Fallback local sécurisé
    try {
      const dir = path.dirname(this.storagePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      if (fs.existsSync(this.storagePath)) {
        const raw = fs.readFileSync(this.storagePath, 'utf-8');
        const list: Incident[] = JSON.parse(raw);
        list.forEach((item) => this.inMemoryCache.set(item.id, item));
      } else {
        this.seedInitialData();
        this.persistLocal();
      }
    } catch {
      this.seedInitialData();
    }
  }

  private mapSupabaseRowToIncident(row: any): Incident {
    return {
      id: row.id,
      lat: Number(row.lat),
      lng: Number(row.lon ?? row.lng),
      lon: Number(row.lon ?? row.lng),
      location_name: row.location_name,
      severity: row.severity,
      category: row.category,
      description: row.description,
      source: row.source,
      reports_count: Number(row.reports_count ?? 1),
      upvotes: Number(row.upvotes ?? 1),
      downvotes: Number(row.downvotes ?? 0),
      reliability_score: Number(row.reliability_score ?? 0.7),
      expires_at: row.expires_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private persistLocal() {
    try {
      const data = Array.from(this.inMemoryCache.values());
      fs.writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[IncidentRepo] Erreur sauvegarde locale:', err);
    }
  }

  private seedInitialData() {
    const now = Date.now();
    const seed: Incident[] = [
      {
        id: 'inc-paris-1',
        lat: 48.8675,
        lng: 2.3638,
        lon: 2.3638,
        location_name: 'Place de la République 75011 Paris',
        severity: 'danger',
        category: 'manifestation',
        description: 'Rassemblement important avec tensions, feux de poubelles et gaz lacrymogènes en marge du cortège.',
        source: 'Signalement vérifié',
        reports_count: 5,
        upvotes: 64,
        downvotes: 3,
        reliability_score: 0.95,
        expires_at: new Date(now + 120 * 60000).toISOString(),
        created_at: new Date(now - 15 * 60000).toISOString(),
      },
      {
        id: 'inc-paris-2',
        lat: 48.8532,
        lng: 2.3698,
        lon: 2.3698,
        location_name: 'Place de la Bastille 75011 Paris',
        severity: 'warning',
        category: 'tension',
        description: 'Barrages policiers et filtrage des piétons boulevard Beaumarchais et rue de la Roquette.',
        source: 'Signalement citoyen',
        reports_count: 3,
        upvotes: 28,
        downvotes: 2,
        reliability_score: 0.88,
        expires_at: new Date(now + 90 * 60000).toISOString(),
        created_at: new Date(now - 35 * 60000).toISOString(),
      },
      {
        id: 'inc-paris-3',
        lat: 48.8656,
        lng: 2.3212,
        lon: 2.3212,
        location_name: 'Place de la Concorde 75008 Paris',
        severity: 'safe',
        category: 'calme',
        description: 'Zone totalement dégagée et sécurisée. Métro et bus fonctionnent normalement.',
        source: 'Signalement vérifié Préfecture',
        reports_count: 4,
        upvotes: 41,
        downvotes: 1,
        reliability_score: 0.98,
        expires_at: new Date(now + 60 * 60000).toISOString(),
        created_at: new Date(now - 75 * 60000).toISOString(),
      },
      {
        id: 'inc-paris-4',
        lat: 48.8606,
        lng: 2.3476,
        lon: 2.3476,
        location_name: 'Châtelet - Les Halles 75001 Paris',
        severity: 'warning',
        category: 'fermeture_station',
        description: 'Forte affluence inhabituelle et accès partiel restreint porte Lescot suite à un mouvement de foule.',
        source: 'Signalement citoyen',
        reports_count: 2,
        upvotes: 19,
        downvotes: 0,
        reliability_score: 0.92,
        expires_at: new Date(now + 45 * 60000).toISOString(),
        created_at: new Date(now - 20 * 60000).toISOString(),
      },
    ];

    seed.forEach((item) => this.inMemoryCache.set(item.id, item));
  }

  /**
   * Moteur de recherche d'un incident actif dans un rayon de maxMeters (par défaut 50m)
   */
  findNearbyActiveIncident(lat: number, lng: number, maxMeters: number = 50): Incident | null {
    const now = Date.now();
    let closestIncident: Incident | null = null;
    let minDistance = Infinity;

    for (const incident of this.inMemoryCache.values()) {
      // Ignore les incidents expirés ou résolus
      if (incident.resolved || new Date(incident.expires_at).getTime() <= now) {
        continue;
      }

      const dist = getDistanceMeters(lat, lng, incident.lat, incident.lng);
      if (dist <= maxMeters && dist < minDistance) {
        minDistance = dist;
        closestIncident = incident;
      }
    }

    return closestIncident;
  }

  /**
   * Traitement d'un signalement : Clustering géospatial (50m) + Résolution Conflit (Rouge vs Vert) + TTL
   */
  async processIncidentReport(data: {
    lat: number;
    lng: number;
    location_name: string;
    severity: Severity;
    category?: Incident['category'];
    description: string;
    source: string;
  }): Promise<{ incident: Incident; isClusterMerge: boolean; conflictResolved?: boolean }> {
    const nearby = this.findNearbyActiveIncident(data.lat, data.lng, 50);

    // =========================================================================
    // CAS 1 : Incident existant dans le rayon de 50 mètres
    // =========================================================================
    if (nearby) {
      const now = new Date();
      const createdAt = new Date(nearby.created_at);
      const currentExpiry = new Date(nearby.expires_at);

      // --- SOUS-CAS 1A : CONFLIT / INFIRMATION (ex: "Safe" / Vert contre "Danger" / Rouge) ---
      const isCounterReport =
        (nearby.severity === 'danger' || nearby.severity === 'warning') && data.severity === 'safe';

      if (isCounterReport) {
        nearby.downvotes += 1;
        nearby.reliability_score = this.computeReliability(nearby);
        nearby.updated_at = now.toISOString();

        console.log(`⚖️ [Conflit] Signalement "Safe" reçu sur zone à risque [${nearby.id}] - Downvotes: ${nearby.downvotes}`);

        // Si 2 signalements "Safe" ou score très bas : résolution / rétrogradation
        if (nearby.downvotes >= 2 || nearby.reliability_score < 0.4) {
          if (nearby.severity === 'danger') {
            // Rétrograde en simple vigilance
            nearby.severity = 'warning';
            nearby.description = `${nearby.description} [Mise à jour: signalements de retour au calme en cours]`;
          } else {
            // Rétrograde en résolu / safe ou fermeture
            nearby.severity = 'safe';
            nearby.resolved = true;
            // TTL raccourci à 10 min pour archivage rapide
            nearby.expires_at = new Date(now.getTime() + 10 * 60000).toISOString();
            console.log(`🟢 [Résolu] Zone de tension [${nearby.id}] déclarée calme et résolue`);
          }
        }

        await this.saveIncident(nearby);
        return { incident: nearby, isClusterMerge: true, conflictResolved: true };
      }

      // --- SOUS-CAS 1B : FUSION CLUSTERING (Même catégorie ou renforcement de gravité) ---
      nearby.reports_count += 1;
      nearby.upvotes += 1;
      nearby.reliability_score = this.computeReliability(nearby);
      nearby.updated_at = now.toISOString();

      // Si le nouveau signalement est plus grave (ex: tension -> danger), on rehausse la sévérité
      if (data.severity === 'danger' && nearby.severity !== 'danger') {
        nearby.severity = 'danger';
      }

      // Prolongation dynamique du TTL (+30 minutes, max 6h depuis création)
      const maxGlobalExpiry = new Date(createdAt.getTime() + 6 * 3600 * 1000); // 6h max
      const extendedExpiry = new Date(currentExpiry.getTime() + 30 * 60 * 1000); // +30 min

      nearby.expires_at = (extendedExpiry > maxGlobalExpiry ? maxGlobalExpiry : extendedExpiry).toISOString();

      // Mise à jour de la description avec le signalement le plus récent (strictement limité à 160 caractères)
      if (data.description && data.description.length > 10) {
        nearby.description = data.description.slice(0, 160);
      }

      console.log(`🔗 [Clustering 50m] Fusion avec l'incident [${nearby.id}] - Reports: ${nearby.reports_count}, TTL étendu jusqu'à ${nearby.expires_at}`);

      await this.saveIncident(nearby);
      return { incident: nearby, isClusterMerge: true };
    }

    // =========================================================================
    // CAS 2 : Aucun incident proche (<50m) -> Création d'un NOUVEAU point
    // =========================================================================
    const now = new Date();
    // TTL de base : 1 heure
    const baseExpiry = new Date(now.getTime() + 60 * 60 * 1000);

    const newIncident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lat: data.lat,
      lng: data.lng,
      lon: data.lng,
      location_name: data.location_name,
      severity: data.severity,
      category: data.category || 'autre',
      description: data.description,
      source: data.source,
      reports_count: 1,
      upvotes: 1,
      downvotes: 0,
      reliability_score: 0.7,
      expires_at: baseExpiry.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    await this.saveIncident(newIncident);
    console.log(`📍 [Nouveau Point] Incident créé [${newIncident.id}] "${newIncident.location_name}" - Expire à ${newIncident.expires_at}`);

    return { incident: newIncident, isClusterMerge: false };
  }

  /**
   * Création standard (intègre automatiquement le clustering 50m et le TTL)
   */
  async create(data: {
    lat: number;
    lng: number;
    location_name: string;
    severity: Severity;
    category?: Incident['category'];
    description: string;
    source: string;
  }): Promise<Incident> {
    const result = await this.processIncidentReport(data);
    return result.incident;
  }

  /**
   * Sauvegarde unitaire (Supabase + cache mémoire)
   */
  private async saveIncident(incident: Incident): Promise<void> {
    this.inMemoryCache.set(incident.id, incident);
    this.persistLocal();

    if (isSupabaseEnabled && supabase) {
      try {
        const payload = {
          id: incident.id.startsWith('inc-') ? undefined : incident.id, // Laisse Supabase générer UUID si besoin
          lat: incident.lat,
          lon: incident.lng,
          location_name: incident.location_name,
          category: incident.category || 'autre',
          severity: incident.severity,
          description: incident.description,
          source: incident.source,
          reports_count: incident.reports_count,
          upvotes: incident.upvotes,
          downvotes: incident.downvotes,
          reliability_score: incident.reliability_score,
          expires_at: incident.expires_at,
          created_at: incident.created_at,
          updated_at: incident.updated_at,
        };

        await supabase.from('incidents').upsert(payload);
      } catch (err: any) {
        console.warn('⚠️ [Supabase] Erreur upsert incident:', err.message);
      }
    }
  }

  async getAll(filters?: IncidentQueryFilters): Promise<Incident[]> {
    const now = Date.now();
    const maxAgeMs = 12 * 3600 * 1000;
    let list = Array.from(this.inMemoryCache.values());

    // Filtrage strict : exclut les incidents expirés, résolus, de janvier ou vieux de >12h
    list = list.filter((i) => {
      if (i.resolved) return false;
      if (new Date(i.expires_at).getTime() <= now) return false;
      const ageMs = now - new Date(i.created_at).getTime();
      if (ageMs > maxAgeMs) return false;
      const desc = (i.description || '').toLowerCase();
      if (desc.includes('janvier') || desc.includes('nouvelle vidéo') || desc.includes('patrick bruel')) return false;
      return true;
    });

    if (filters?.severity) {
      list = list.filter((i) => i.severity === filters.severity);
    }

    if (filters?.since) {
      const sinceDate = new Date(filters.since).getTime();
      list = list.filter((i) => new Date(i.created_at).getTime() >= sinceDate);
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (filters?.limit && filters.limit > 0) {
      list = list.slice(0, filters.limit);
    }

    return list;
  }

  async getById(id: string): Promise<Incident | null> {
    const inc = this.inMemoryCache.get(id);
    if (!inc) return null;
    if (inc.resolved || new Date(inc.expires_at).getTime() <= Date.now()) return null;
    return inc;
  }

  async upvote(id: string): Promise<Incident | null> {
    const inc = this.inMemoryCache.get(id);
    if (!inc) return null;

    inc.upvotes += 1;
    inc.reliability_score = this.computeReliability(inc);
    inc.updated_at = new Date().toISOString();

    // Un upvote prolonge également la durée de vie de 15 minutes (max 6h)
    const currentExpiry = new Date(inc.expires_at).getTime();
    const maxGlobalExpiry = new Date(inc.created_at).getTime() + 6 * 3600 * 1000;
    const newExpiry = Math.min(maxGlobalExpiry, currentExpiry + 15 * 60 * 1000);
    inc.expires_at = new Date(newExpiry).toISOString();

    await this.saveIncident(inc);
    return inc;
  }

  async downvote(id: string): Promise<Incident | null> {
    const inc = this.inMemoryCache.get(id);
    if (!inc) return null;

    inc.downvotes += 1;
    inc.reliability_score = this.computeReliability(inc);
    inc.updated_at = new Date().toISOString();

    // Si trop de downvotes, résolution automatique
    if (inc.downvotes >= 4 && inc.reliability_score < 0.35) {
      inc.resolved = true;
      inc.expires_at = new Date().toISOString(); // Expire immédiatement
    }

    await this.saveIncident(inc);
    return inc;
  }

  /**
   * Supprime un incident par son ID
   */
  async deleteById(id: string): Promise<boolean> {
    const exists = this.inMemoryCache.has(id);
    this.inMemoryCache.delete(id);
    this.persistLocal();

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('incidents').delete().eq('id', id);
      } catch (err: any) {
        console.warn('⚠️ [Supabase] Erreur suppression par ID:', err.message);
      }
    }

    return exists;
  }

  /**
   * Purge tous les signalements de janvier, obsolètes (>12h) ou faux
   */
  async purgeObsoleteIncidents(): Promise<string[]> {
    const now = Date.now();
    const maxAgeMs = 12 * 3600 * 1000;
    const purgedIds: string[] = [];

    for (const [id, incident] of this.inMemoryCache.entries()) {
      const ageMs = now - new Date(incident.created_at).getTime();
      const desc = (incident.description || '').toLowerCase();
      const isJanuary = desc.includes('janvier') || new Date(incident.created_at).getMonth() === 0;
      const isTooOld = ageMs > maxAgeMs;
      const isTooLong = (incident.description || '').length > 200;

      if (incident.resolved || isJanuary || isTooOld || isTooLong) {
        purgedIds.push(id);
        this.inMemoryCache.delete(id);
      }
    }

    if (purgedIds.length > 0) {
      this.persistLocal();
      console.log(`🧹 [Purge] ${purgedIds.length} faux ou anciens signalements supprimés.`);

      if (isSupabaseEnabled && supabase) {
        try {
          await supabase.from('incidents').delete().in('id', purgedIds);
        } catch (err: any) {
          console.warn('⚠️ [Supabase] Erreur suppression purge:', err.message);
        }
      }
    }

    return purgedIds;
  }

  /**
   * Remise à zéro totale de la carte
   */
  async clearAll(): Promise<string[]> {
    const allIds = Array.from(this.inMemoryCache.keys());
    this.inMemoryCache.clear();
    this.persistLocal();

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('incidents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err: any) {
        console.warn('⚠️ [Supabase] Erreur suppression totale:', err.message);
      }
    }

    return allIds;
  }

  /**
   * Nettoyage automatique des incidents expirés
   */
  async cleanupExpired(): Promise<string[]> {
    const now = Date.now();
    const expiredIds: string[] = [];

    for (const [id, incident] of this.inMemoryCache.entries()) {
      if (incident.resolved || new Date(incident.expires_at).getTime() <= now) {
        expiredIds.push(id);
        this.inMemoryCache.delete(id);
      }
    }

    if (expiredIds.length > 0) {
      this.persistLocal();
      console.log(`🧹 [Cleanup] ${expiredIds.length} incident(s) expiré(s) retiré(s) de la carte.`);

      if (isSupabaseEnabled && supabase) {
        try {
          await supabase.from('incidents').delete().in('id', expiredIds);
        } catch (err: any) {
          console.warn('⚠️ [Supabase] Erreur suppression expirés:', err.message);
        }
      }
    }

    return expiredIds;
  }

  private startAutoCleanup(intervalMs: number = 30000) {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired().catch(() => {});
    }, intervalMs);
  }

  private computeReliability(inc: Incident): number {
    const total = inc.upvotes + inc.downvotes;
    if (total === 0) return 0.5;
    const ratio = inc.upvotes / total;
    const confidence = Math.min(1, total / 10);
    return Number(((ratio * confidence) + (0.5 * (1 - confidence))).toFixed(2));
  }
}

export const incidentRepository = new IncidentRepository();
