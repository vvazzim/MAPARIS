import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { safeRoutingService } from '../services/safeRoutingService.js';

const pointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const routingRequestSchema = z.object({
  origin: z.union([z.string().min(2), pointSchema]),
  destination: z.union([z.string().min(2), pointSchema]),
});

export const routingRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/routing/safe-path
   * Calcule un itinéraire sécurisé évitant les zones d'affrontements et manifestations
   */
  fastify.post('/api/routing/safe-path', async (request, reply) => {
    const parsed = routingRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Paramètres invalides pour l\'itinéraire',
        details: parsed.error.errors,
      });
    }

    try {
      const { origin, destination } = parsed.data;
      const result = await safeRoutingService.computeSafeRoute(origin, destination);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (err: any) {
      return reply.status(500).send({
        success: false,
        error: `Erreur calcul itinéraire: ${err.message}`,
      });
    }
  });
};
