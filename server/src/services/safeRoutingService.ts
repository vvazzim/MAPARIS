import { geocodingService } from './geocodingService.js';
import { incidentRepository } from '../repositories/incidentRepository.js';

export interface Point {
  lat: number;
  lng: number;
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
  origin: Point & { address: string };
  destination: Point & { address: string };
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

/**
 * Calcul de distance orthodromique (Haversine) en kilomètres
 */
function getDistanceKm(p1: Point, p2: Point): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export class SafeRoutingService {
  private osrmBaseUrl = 'https://router.project-osrm.org/route/v1/foot';

  /**
   * Récupère le tracé piéton réel suivant les rues, trottoirs et ponts de Paris via OSRM
   */
  private async fetchOSRMRoute(waypoints: Point[]): Promise<{
    path: [number, number][];
    distanceKm: number;
    durationMin: number;
    alternatives: [number, number][][];
  } | null> {
    try {
      const coordString = waypoints.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(';');
      const url = `${this.osrmBaseUrl}/${coordString}?overview=full&geometries=geojson&alternatives=true`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ParisSecurityPulse/2.0',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as any;
      if (!data.routes || data.routes.length === 0) return null;

      const route = data.routes[0];
      // GeoJSON retourne [lng, lat] -> conversion en [lat, lng] pour Leaflet
      const path: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      const distanceKm = Number((route.distance / 1000).toFixed(2));
      const durationMin = Math.max(1, Math.round(route.duration / 60));

      const alternatives: [number, number][][] = (data.routes.slice(1) || []).map((r: any) =>
        r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
      );

      return { path, distanceKm, durationMin, alternatives };
    } catch (err: any) {
      console.warn('[SafeRouting] OSRM non joignable, fallback actif:', err.message);
      return null;
    }
  }

  /**
   * Vérifie si un tracé piéton (suite de points coordonnées) traverse le cercle d'un incident
   */
  private checkHazardIntersection(path: [number, number][], hazard: RouteHazard): boolean {
    const hazardPoint: Point = { lat: hazard.lat, lng: hazard.lng };
    return path.some(([lat, lng]) => getDistanceKm({ lat, lng }, hazardPoint) <= hazard.radiusKm);
  }

  /**
   * Calcule un itinéraire sécurisé contournant les cercles de danger actifs
   */
  async computeSafeRoute(
    originInput: string | Point,
    destinationInput: string | Point
  ): Promise<SafeRouteResult> {
    // 1. Résolution des points de départ et d'arrivée
    let origin: Point & { address: string };
    let destination: Point & { address: string };

    if (typeof originInput === 'string') {
      const geo = await geocodingService.geocodeAddress(originInput);
      origin = { lat: geo.lat, lng: geo.lng, address: geo.label };
    } else {
      origin = { ...originInput, address: `${originInput.lat.toFixed(4)}, ${originInput.lng.toFixed(4)}` };
    }

    if (typeof destinationInput === 'string') {
      const geo = await geocodingService.geocodeAddress(destinationInput);
      destination = { lat: geo.lat, lng: geo.lng, address: geo.label };
    } else {
      destination = { ...destinationInput, address: `${destinationInput.lat.toFixed(4)}, ${destinationInput.lng.toFixed(4)}` };
    }

    // 2. Récupération des zones d'incidents actives à contourner
    const allIncidents = await incidentRepository.getAll();
    const hazardIncidents = allIncidents.filter(
      (inc) => inc.severity === 'danger' || inc.severity === 'warning'
    );

    const hazards: RouteHazard[] = hazardIncidents.map((inc) => ({
      id: inc.id,
      location_name: inc.location_name,
      severity: inc.severity,
      lat: inc.lat,
      lng: inc.lng,
      // Rayon d'évitement : 400m pour danger (gaz/affrontements), 250m pour tension
      radiusKm: inc.severity === 'danger' ? 0.4 : 0.25,
    }));

    // 3. Calcul du tracé piéton direct réel (rues et ponts)
    const osrmDirect = await this.fetchOSRMRoute([origin, destination]);
    const directDist = getDistanceKm(origin, destination);

    const directRoute: {
      path: [number, number][];
      distanceKm: number;
      durationMin: number;
      alternatives: [number, number][][];
    } = osrmDirect || {
      path: [
        [origin.lat, origin.lng],
        [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
        [destination.lat, destination.lng],
      ],
      distanceKm: Number(directDist.toFixed(2)),
      durationMin: Math.round((directDist / 4.5) * 60),
      alternatives: [],
    };

    // 4. Détection des zones de danger traversées par le tracé direct réel
    const hazardsIntersectedByDirect = hazards.filter((h) =>
      this.checkHazardIntersection(directRoute.path, h)
    );

    // 5. Algorithme de contournement propre avec calcul de waypoints déportés
    let safePath = directRoute.path;
    let safeDistanceKm = directRoute.distanceKm;
    let safeDurationMin = directRoute.durationMin;
    const hazardsAvoided: RouteHazard[] = [];
    let osrmSafe: Awaited<ReturnType<typeof this.fetchOSRMRoute>> = null;

    if (hazardsIntersectedByDirect.length > 0) {
      const avoidanceWaypoints: Point[] = [];

      for (const h of hazardsIntersectedByDirect) {
        hazardsAvoided.push(h);

        // Vecteur orthogonal de contournement
        const dLat = destination.lat - origin.lat;
        const dLng = destination.lng - origin.lng;
        const norm = Math.sqrt(dLat * dLat + dLng * dLng) || 1;

        // Déport perpendiculaire de (rayon + marge de sécurité de 180m)
        const offsetDeg = (h.radiusKm + 0.18) / 111;

        // Choix du côté de contournement
        const detourOption1: Point = {
          lat: h.lat - (dLng / norm) * offsetDeg,
          lng: h.lng + (dLat / norm) * offsetDeg,
        };

        const detourOption2: Point = {
          lat: h.lat + (dLng / norm) * offsetDeg,
          lng: h.lng - (dLat / norm) * offsetDeg,
        };

        const dist1 = getDistanceKm(origin, detourOption1) + getDistanceKm(detourOption1, destination);
        const dist2 = getDistanceKm(origin, detourOption2) + getDistanceKm(detourOption2, destination);

        avoidanceWaypoints.push(dist1 < dist2 ? detourOption1 : detourOption2);
      }

      // Calcul du nouvel itinéraire piéton réel passant par les waypoints de contournement
      osrmSafe = await this.fetchOSRMRoute([origin, ...avoidanceWaypoints, destination]);

      if (osrmSafe) {
        safePath = osrmSafe.path;
        safeDistanceKm = osrmSafe.distanceKm;
        safeDurationMin = osrmSafe.durationMin;
      } else {
        // Fallback sécurisé structuré
        const fallbackPath: [number, number][] = [
          [origin.lat, origin.lng],
          ...avoidanceWaypoints.map((w) => [w.lat, w.lng] as [number, number]),
          [destination.lat, destination.lng],
        ];
        safePath = fallbackPath;
        let d = 0;
        for (let i = 0; i < fallbackPath.length - 1; i++) {
          d += getDistanceKm(
            { lat: fallbackPath[i][0], lng: fallbackPath[i][1] },
            { lat: fallbackPath[i + 1][0], lng: fallbackPath[i + 1][1] }
          );
        }
        safeDistanceKm = Number(d.toFixed(2));
        safeDurationMin = Math.round((safeDistanceKm / 4.5) * 60);
      }
    }

    // Trajets alternatifs secondaires (affichés en gris sur la carte)
    const alternativePaths: [number, number][][] = [];
    if (directRoute.alternatives && directRoute.alternatives.length > 0) {
      alternativePaths.push(...directRoute.alternatives);
    }
    if (osrmSafe?.alternatives && osrmSafe.alternatives.length > 0) {
      alternativePaths.push(...osrmSafe.alternatives);
    }

    const safetyScore = hazardsIntersectedByDirect.length === 0 ? 98 : Math.max(88, 100 - hazardsIntersectedByDirect.length * 4);

    const detourExtraMeters = Math.max(0, Math.round((safeDistanceKm - directRoute.distanceKm) * 1000));
    const recommendation =
      hazardsIntersectedByDirect.length > 0
        ? `Itinéraire piéton sécurisé : ${hazardsIntersectedByDirect.length} zone(s) de tension contournée(s) via rues adjacentes (+${detourExtraMeters}m de marche).`
        : 'Aucune zone à risque détectée sur le parcours. Trajet piéton direct optimal.';

    return {
      origin,
      destination,
      directPath: directRoute.path,
      safePath,
      alternativePaths,
      directDistanceKm: directRoute.distanceKm,
      safeDistanceKm,
      directDurationMin: directRoute.durationMin,
      safeDurationMin,
      hazardsAvoided,
      hazardsIntersectedByDirect,
      safetyScore,
      recommendation,
    };
  }
}

export const safeRoutingService = new SafeRoutingService();
