import { FastifyPluginAsync } from 'fastify';
import { geocodingService } from '../services/geocodingService.js';

export const geocodeRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/geocode/search?q=...
   * Autocomplétion d'adresses parisiennes pour le frontend
   */
  fastify.get<{ Querystring: { q: string; limit?: string } }>('/api/geocode/search', async (request, reply) => {
    const { q, limit } = request.query;
    if (!q || q.trim().length < 2) {
      return reply.send({ success: true, data: [] });
    }

    const maxResults = limit ? parseInt(limit, 10) : 5;
    const results = await geocodingService.searchAddresses(q, maxResults);

    return reply.send({
      success: true,
      count: results.length,
      data: results,
    });
  });

  /**
   * GET /api/geocode/reverse?lat=...&lng=...
   * Géocodage inverse d'un point cliqué sur la carte
   */
  fastify.get<{ Querystring: { lat: string; lng: string } }>('/api/geocode/reverse', async (request, reply) => {
    const lat = parseFloat(request.query.lat);
    const lng = parseFloat(request.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return reply.status(400).send({
        success: false,
        error: 'Coordonnées lat/lng invalides',
      });
    }

    const label = await geocodingService.reverseGeocode(lat, lng);

    return reply.send({
      success: true,
      data: { lat, lng, label },
    });
  });
};
