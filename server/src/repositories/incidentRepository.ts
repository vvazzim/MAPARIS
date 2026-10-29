import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseEnabled } from '../config/supabase.js';
import { Incident, IncidentQueryFilters, Severity } from '../types/index.js';
import { getReadableLocation } from '../services/landmarkService.js';

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

/**
 * Rayon d'impact / périmètre circulaire selon la gravité (en mètres)
 * danger: 380m, warning: 220m, safe: 140m
 */
export function getIncidentRadius(severity: Severity): number {
  switch (severity) {
    case 'danger': return 380;
    case 'warning': return 220;
    case 'safe': return 140;
    default: return 200;
  }
}

/**
 * Calcul géométrique rigoureux de l'aire d'intersection entre deux disques circulaires
 * r1, r2 = rayons en mètres
 * d = distance entre centres en mètres
 */
export function calculateCircleIntersectionArea(r1: number, r2: number, d: number): number {
  if (d >= r1 + r2) return 0; // Disjoints ou simplement tangents
  if (d <= Math.abs(r1 - r2)) {
    // Un des cercles est complètement à l'intérieur de l'autre (100% de recouvrement du plus petit)
    const minR = Math.min(r1, r2);
    return Math.PI * minR * minR;
  }
  const part1 = (d * d + r1 * r1 - r2 * r2) / (2 * d * r1);
  const part2 = (d * d + r2 * r2 - r1 * r1) / (2 * d * r2);
  const clamped1 = Math.max(-1, Math.min(1, part1));
  const clamped2 = Math.max(-1, Math.min(1, part2));
  const alpha = 2 * Math.acos(clamped1);
  const beta = 2 * Math.acos(clamped2);
  const area = 0.5 * r1 * r1 * (alpha - Math.sin(alpha)) + 0.5 * r2 * r2 * (beta - Math.sin(beta));
  return Math.max(0, area);
}

/**
 * Analyse du croisement géométrique entre deux périmètres de signalement
 * Vérifie si A croise B à plus de 50% de surface (ou distance <= 50m)
 */
export function calculatePerimeterOverlap(
  lat1: number, lon1: number, sev1: Severity,
  lat2: number, lon2: number, sev2: Severity,
  threshold: number = 0.50
): {
  distance: number;
  radius1: number;
  radius2: number;
  intersectionArea: number;
  overlapRatio1: number;
  overlapRatio2: number;
  maxOverlapRatio: number;
  iou: number;
  shouldMerge: boolean;
} {
  const distance = getDistanceMeters(lat1, lon1, lat2, lon2);
  const radius1 = getIncidentRadius(sev1);
  const radius2 = getIncidentRadius(sev2);

  const area1 = Math.PI * radius1 * radius1;
  const area2 = Math.PI * radius2 * radius2;
  const intersectionArea = calculateCircleIntersectionArea(radius1, radius2, distance);

  const overlapRatio1 = area1 > 0 ? intersectionArea / area1 : 0;
  const overlapRatio2 = area2 > 0 ? intersectionArea / area2 : 0;
  const maxOverlapRatio = Math.max(overlapRatio1, overlapRatio2);
  const unionArea = area1 + area2 - intersectionArea;
  const iou = unionArea > 0 ? intersectionArea / unionArea : 0;

  // Fusion si le chevauchement dépasse le seuil demandé (> 50%) ou si les coordonnées sont quasi-identiques (<= 50m)
  const shouldMerge = maxOverlapRatio >= threshold || distance <= 50;

  return {
    distance,
    radius1,
    radius2,
    intersectionArea,
    overlapRatio1,
    overlapRatio2,
    maxOverlapRatio,
    iou,
    shouldMerge,
  };
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
          await this.mergeAllOverlappingIncidents(0.50);
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
        const now = Date.now();
        list.forEach((item) => {
          // Ne conserver que les vrais incidents non expirés (aucun inc-paris-* factice)
          if (!item.id.startsWith('inc-paris-') && !item.resolved && new Date(item.expires_at).getTime() > now) {
            this.inMemoryCache.set(item.id, item);
          }
        });
        this.persistLocal();
      } else {
        this.inMemoryCache.clear();
        this.persistLocal();
      }
      await this.mergeAllOverlappingIncidents(0.50);
    } catch {
      this.inMemoryCache.clear();
      this.persistLocal();
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
    // Mode Production Réelle : ZÉRO fausses données factices injectées.
    // Si la ville est calme, la carte est propre et vide.
  }

  /**
   * Moteur de recherche d'un incident actif dans un rayon de maxMeters (fallback)
   */
  findNearbyActiveIncident(lat: number, lng: number, maxMeters: number = 50): Incident | null {
    const now = Date.now();
    let closestIncident: Incident | null = null;
    let minDistance = Infinity;

    for (const incident of this.inMemoryCache.values()) {
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
   * Moteur de détection de croisement géométrique :
   * Recherche un incident actif dont le périmètre circulaire croise le nouveau signalement à plus de 50%
   */
  findOverlappingActiveIncident(
    lat: number,
    lng: number,
    severity: Severity,
    threshold: number = 0.50
  ): { incident: Incident; overlap: ReturnType<typeof calculatePerimeterOverlap> } | null {
    const now = Date.now();
    let bestMatch: { incident: Incident; overlap: ReturnType<typeof calculatePerimeterOverlap> } | null = null;
    let highestOverlap = 0;

    for (const incident of this.inMemoryCache.values()) {
      // Ignore les incidents expirés ou résolus
      if (incident.resolved || new Date(incident.expires_at).getTime() <= now) {
        continue;
      }

      const overlap = calculatePerimeterOverlap(
        lat,
        lng,
        severity,
        incident.lat,
        incident.lng,
        incident.severity,
        threshold
      );

      // Si le périmètre croise à plus de 50% (ou distance <= 50m)
      if (overlap.shouldMerge && overlap.maxOverlapRatio >= highestOverlap) {
        highestOverlap = overlap.maxOverlapRatio;
        bestMatch = { incident, overlap };
      }
    }

    return bestMatch;
  }

  /**
   * Traitement d'un signalement : Clustering par croisement de périmètres (>50%) + Résolution Conflit + TTL
   */
  async processIncidentReport(data: {
    lat: number;
    lng: number;
    location_name: string;
    severity: Severity;
    category?: Incident['category'];
    description: string;
    source: string;
    ttlSeconds?: number;
  }): Promise<{ incident: Incident; isClusterMerge: boolean; conflictResolved?: boolean }> {
    // Garantit que l'emplacement est toujours un repère parisien ou une adresse lisible, jamais des coordonnées brutes
    const resolvedLocationName = getReadableLocation(data.lat, data.lng, data.location_name);

    // Détection d'un incident actif dont le périmètre se croise à plus de 50%
    const overlapMatch = this.findOverlappingActiveIncident(data.lat, data.lng, data.severity, 0.50);

    // =========================================================================
    // CAS 1 : Incident existant dont le périmètre croise à plus de 50%
    // =========================================================================
    if (overlapMatch) {
      const nearby = overlapMatch.incident;
      const { overlap } = overlapMatch;
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

      // --- SOUS-CAS 1B : FUSION CLUSTERING PAR PÉRIMÈTRE (>50% de recouvrement) ---
      // Calcul du barycentre pondéré pour ajuster le centre réel de l'incident
      const totalReports = nearby.reports_count + 1;
      const wOld = nearby.reports_count;
      const wNew = 1;
      const mergedLat = Number(((nearby.lat * wOld + data.lat * wNew) / totalReports).toFixed(6));
      const mergedLng = Number(((nearby.lng * wOld + data.lng * wNew) / totalReports).toFixed(6));

      nearby.lat = mergedLat;
      nearby.lng = mergedLng;
      nearby.lon = mergedLng;
      // Met à jour le nom vers le repère le plus proche du nouveau barycentre
      nearby.location_name = getReadableLocation(mergedLat, mergedLng, nearby.location_name);

      nearby.reports_count += 1;
      nearby.upvotes += 1;
      nearby.reliability_score = this.computeReliability(nearby);
      nearby.updated_at = now.toISOString();

      // Si le nouveau signalement est plus grave (ex: tension -> danger), on rehausse la sévérité
      if (data.severity === 'danger' && nearby.severity !== 'danger') {
        nearby.severity = 'danger';
      }

      // Prolongation dynamique courte : max 30 min pour MediaManif, max 60 min pour citoyen (fini les 120min !)
      const isMediaManif = (nearby.source && nearby.source.includes('MediaManif')) || (data.source && data.source.includes('MediaManif'));
      const maxLifespanMs = isMediaManif ? 30 * 60 * 1000 : 60 * 60 * 1000;
      const maxGlobalExpiry = new Date(createdAt.getTime() + maxLifespanMs);
      const extendedExpiry = new Date(currentExpiry.getTime() + (isMediaManif ? 10 * 60 * 1000 : 30 * 60 * 1000));
      nearby.expires_at = (extendedExpiry > maxGlobalExpiry ? maxGlobalExpiry : extendedExpiry).toISOString();

      // Mise à jour de la description avec le signalement le plus récent (strictement limité à 160 caractères)
      if (data.description && data.description.length > 10) {
        nearby.description = data.description.slice(0, 160);
      }

      console.log(`🔗 [Fusion Périmètres > 50%] Fusion dans [${nearby.id}] - Croisement: ${(overlap.maxOverlapRatio * 100).toFixed(1)}%, Dist: ${overlap.distance.toFixed(0)}m, Barycentre: [${mergedLat}, ${mergedLng}] (${nearby.location_name})`);

      await this.saveIncident(nearby);
      return { incident: nearby, isClusterMerge: true };
    }

    // =========================================================================
    // CAS 2 : Aucun périmètre croisé à >50% -> Création d'un NOUVEAU point
    // =========================================================================
    const now = new Date();
    // TTL dynamique réactif : 20 min MediaManif, 30 min citoyen (suppression rapide, plus de 120min)
    const isMediaManif = data.source && data.source.includes('MediaManif');
    const defaultTtlSec = isMediaManif ? 1200 : 1800; // 20 min pour MediaManif, 30 min pour citoyen
    const ttlMs = (data.ttlSeconds !== undefined ? data.ttlSeconds : defaultTtlSec) * 1000;
    const baseExpiry = new Date(now.getTime() + ttlMs);

    const newIncident: Incident = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lat: data.lat,
      lng: data.lng,
      lon: data.lng,
      location_name: resolvedLocationName,
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
   * Consolidation globale : fusionne tous les incidents actifs existants dont les périmètres se croisent à plus de 50%
   */
  async mergeAllOverlappingIncidents(threshold: number = 0.50): Promise<{ mergedCount: number; deletedIds: string[] }> {
    const now = Date.now();
    const activeList = Array.from(this.inMemoryCache.values()).filter(
      (inc) => !inc.resolved && new Date(inc.expires_at).getTime() > now
    );

    const deletedIds: string[] = [];
    let mergedCount = 0;

    for (let i = 0; i < activeList.length; i++) {
      const incA = activeList[i];
      if (deletedIds.includes(incA.id)) continue;

      for (let j = i + 1; j < activeList.length; j++) {
        const incB = activeList[j];
        if (deletedIds.includes(incB.id)) continue;

        const overlap = calculatePerimeterOverlap(
          incA.lat,
          incA.lng,
          incA.severity,
          incB.lat,
          incB.lng,
          incB.severity,
          threshold
        );

        if (overlap.shouldMerge) {
          console.log(`🔗 [Consolidation Périmètres >50%] Fusion [${incB.id}] (${incB.location_name}) -> [${incA.id}] (${incA.location_name}) - Recouvrement: ${(overlap.maxOverlapRatio * 100).toFixed(1)}%`);

          // Barycentre pondéré
          const total = incA.reports_count + incB.reports_count;
          const wA = incA.reports_count;
          const wB = incB.reports_count;
          const newLat = Number(((incA.lat * wA + incB.lat * wB) / total).toFixed(6));
          const newLng = Number(((incA.lng * wA + incB.lng * wB) / total).toFixed(6));

          incA.lat = newLat;
          incA.lng = newLng;
          incA.lon = newLng;
          incA.location_name = getReadableLocation(newLat, newLng);

          // Élévation de gravité
          if (incB.severity === 'danger' || incA.severity === 'danger') {
            incA.severity = 'danger';
          } else if (incB.severity === 'warning' || incA.severity === 'warning') {
            incA.severity = 'warning';
          }

          incA.reports_count = total;
          incA.upvotes += incB.upvotes;
          incA.downvotes += incB.downvotes;
          incA.reliability_score = this.computeReliability(incA);
          incA.updated_at = new Date().toISOString();

          // Extension de validité
          const expA = new Date(incA.expires_at).getTime();
          const expB = new Date(incB.expires_at).getTime();
          incA.expires_at = new Date(Math.max(expA, expB)).toISOString();

          // Supprime l'incident absorbé incB
          await this.deleteById(incB.id);
          deletedIds.push(incB.id);
          mergedCount++;

          await this.saveIncident(incA);
        }
      }
    }

    if (mergedCount > 0) {
      console.log(`✅ [Consolidation Périmètres] ${mergedCount} incidents redondants fusionnés.`);
    }

    return { mergedCount, deletedIds };
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
    if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
      this.cleanupInterval.unref();
    }
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
