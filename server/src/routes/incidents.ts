import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { incidentRepository } from '../repositories/incidentRepository.js';
import { geocodingService } from '../services/geocodingService.js';
import { 
  broadcastNewIncident, 
  broadcastIncidentUpdated, 
  broadcastIncidentExpired 
} from '../sockets/socketHandler.js';
import { Severity, IncidentCategory } from '../types/index.js';

const createIncidentSchema = z.object({
  address: z.string().min(2, "L'adresse doit comporter au moins 2 caractères"),
  severity: z.enum(['danger', 'warning', 'safe'] as const, {
    errorMap: () => ({ message: "La sévérité doit être 'danger', 'warning' ou 'safe'" }),
  }),
  description: z.string().min(5, 'La description doit comporter au moins 5 caractères'),
  category: z.enum([
    'manifestation',
    'blocage',
    'tension',
    'fermeture_station',
    'degradation',
    'calme',
    'autre',
  ] as const).optional(),
  source: z.string().optional().default('Signalement citoyen'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const queryFilterSchema = z.object({
  severity: z.enum(['danger', 'warning', 'safe']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  since: z.string().datetime().optional(),
});

export const incidentRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/incidents
   * Récupère la liste des incidents avec filtres optionnels
   */
  fastify.get('/api/incidents', async (request, reply) => {
    try {
      const filters = queryFilterSchema.parse(request.query);
      const incidents = await incidentRepository.getAll({
        severity: filters.severity as Severity | undefined,
        limit: filters.limit ?? 50,
        since: filters.since,
      });

      return reply.send({
        success: true,
        count: incidents.length,
        data: incidents,
      });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: err.message,
      });
    }
  });

  /**
   * GET /api/incidents/:id
   * Récupère un incident spécifique par son ID
   */
  fastify.get<{ Params: { id: string } }>('/api/incidents/:id', async (request, reply) => {
    const incident = await incidentRepository.getById(request.params.id);
    if (!incident) {
      return reply.status(404).send({
        success: false,
        error: 'Incident introuvable',
      });
    }

    return reply.send({
      success: true,
      data: incident,
    });
  });

  /**
   * POST /api/incidents
   * Soumission d'une alerte avec géocodage BAN, clustering géospatial (50m),
   * TTL dynamique (1h base / +30m fusion), résolution de conflit & anti-flood.
   */
  fastify.post('/api/incidents', {
    config: {
      rateLimit: {
        max: process.env.NODE_ENV === 'test' ? 100 : 1,
        timeWindow: '3 minutes',
        keyGenerator: (req) => {
          // Zéro-Log : hachage anonyme sans trace d'adresse IP
          return req.headers['x-client-token']?.toString() ||
                 req.headers['user-agent']?.slice(0, 30) ||
                 'anonymous-source';
        },
        errorResponseBuilder: () => ({
          status: 'error',
          statusCode: 429,
          error: 'Protection anti-flood activée : 1 signalement maximum toutes les 3 minutes par appareil.',
        }),
      },
    },
  }, async (request, reply) => {
    const parseResult = createIncidentSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        status: 'error',
        success: false,
        error: 'Données de formulaire invalides',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }

    const input = parseResult.data;
    let finalLat = input.lat;
    let finalLng = input.lng;
    let locationName = input.address;
    let geocodedMeta = null;

    // Si les coordonnées ne sont pas fournies directement, appel à l'API Adresse BAN
    if (finalLat === undefined || finalLng === undefined) {
      const geoResult = await geocodingService.geocodeAddress(input.address);
      finalLat = geoResult.lat;
      finalLng = geoResult.lng;
      locationName = geoResult.label;
      geocodedMeta = {
        score: geoResult.score,
        postcode: geoResult.postcode,
        city: geoResult.city,
      };
    }

    // Traitement avec clustering géospatial (50m), TTL dynamique & gestion de conflit
    const { incident, isClusterMerge, conflictResolved } = await incidentRepository.processIncidentReport({
      lat: finalLat,
      lng: finalLng,
      location_name: locationName,
      severity: input.severity,
      category: input.category as IncidentCategory,
      description: input.description,
      source: input.source,
    });

    // Diffusion temps réel ciblée
    if (isClusterMerge) {
      broadcastIncidentUpdated(incident);
    } else {
      broadcastNewIncident(incident);
    }

    return reply.status(201).send({
      status: 'success',
      incident,
      clustered: isClusterMerge,
      conflict_resolved: conflictResolved,
      success: true,
      data: incident,
      geocoded: geocodedMeta,
    });
  });

  /**
   * POST /api/incidents/:id/upvote
   * Valide et augmente la fiabilité d'un signalement
   */
  fastify.post<{ Params: { id: string } }>('/api/incidents/:id/upvote', async (request, reply) => {
    const updated = await incidentRepository.upvote(request.params.id);
    if (!updated) {
      return reply.status(404).send({ success: false, error: 'Incident introuvable' });
    }

    broadcastIncidentUpdated(updated);
    return reply.send({ success: true, data: updated });
  });

  /**
   * POST /api/incidents/:id/downvote
   * Signale une alerte obsolète ou fausse
   */
  fastify.post<{ Params: { id: string } }>('/api/incidents/:id/downvote', async (request, reply) => {
    const updated = await incidentRepository.downvote(request.params.id);
    if (!updated) {
      return reply.status(404).send({ success: false, error: 'Incident introuvable' });
    }

    if (updated.resolved) {
      broadcastIncidentExpired(updated.id);
    } else {
      broadcastIncidentUpdated(updated);
    }

    return reply.send({ success: true, data: updated, resolved: updated.resolved });
  });

  /**
   * DELETE /api/incidents/:id
   * Supprime manuellement un faux signalement
   */
  fastify.delete<{ Params: { id: string } }>('/api/incidents/:id', async (request, reply) => {
    const deleted = await incidentRepository.deleteById(request.params.id);
    broadcastIncidentExpired(request.params.id);
    return reply.send({ success: true, deleted, id: request.params.id });
  });

  /**
   * POST /api/incidents/purge-obsolete
   * Purge automatique de tous les signalements de janvier ou textes excessifs
   */
  fastify.post('/api/incidents/purge-obsolete', async (request, reply) => {
    const purgedIds = await incidentRepository.purgeObsoleteIncidents();
    purgedIds.forEach((id) => broadcastIncidentExpired(id));
    return reply.send({ success: true, count: purgedIds.length, purgedIds });
  });

  /**
   * POST /api/incidents/merge-overlapping
   * Déclenche la fusion géométrique de tous les signalements dont les périmètres croisent à plus de 50%
   */
  fastify.post('/api/incidents/merge-overlapping', async (request, reply) => {
    const { mergedCount, deletedIds } = await incidentRepository.mergeAllOverlappingIncidents(0.50);
    deletedIds.forEach((id) => broadcastIncidentExpired(id));
    const all = await incidentRepository.getAll({});
    all.forEach((inc) => broadcastIncidentUpdated(inc));
    return reply.send({ success: true, mergedCount, deletedIds, remainingCount: all.length });
  });

  /**
   * POST /api/incidents/clear-all
   * Remise à zéro complète de la carte
   */
  fastify.post('/api/incidents/clear-all', async (request, reply) => {
    const allIds = await incidentRepository.clearAll();
    allIds.forEach((id) => broadcastIncidentExpired(id));
    return reply.send({ success: true, count: allIds.length, cleared: true });
  });
};
