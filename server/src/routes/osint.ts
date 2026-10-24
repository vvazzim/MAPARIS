import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { osintIngestionService } from '../services/osintIngestionService.js';

const parseTextSchema = z.object({
  text: z.string().min(5, 'Le message brut doit contenir au moins 5 caractères'),
  source: z.string().optional().default('Telegram OSINT'),
  author: z.string().optional().default('@ParisManifLive'),
});

export const osintRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/osint/simulate
   * Simule l'arrivée instantanée d'un flux OSINT réaliste (Telegram, Twitter/X, Préfecture)
   */
  fastify.post('/api/osint/simulate', async () => {
    const result = await osintIngestionService.simulateIncomingEvent();
    return {
      success: true,
      message: 'Alerte OSINT simulée et diffusée avec succès',
      data: result,
    };
  });

  /**
   * POST /api/osint/parse-text
   * Ingestion manuelle d'un message brut copié/collé depuis les réseaux
   */
  fastify.post('/api/osint/parse-text', async (request, reply) => {
    const parsed = parseTextSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Champs invalides',
        details: parsed.error.errors,
      });
    }

    const { text, source, author } = parsed.data;
    const result = await osintIngestionService.ingest({
      id: `osint-${Date.now()}`,
      source,
      author,
      text,
      timestamp: new Date().toISOString(),
    });

    return reply.status(201).send({
      success: true,
      data: result,
    });
  });

  /**
   * GET /api/osint/feed
   * Historique des alertes captées par le pipeline OSINT
   */
  fastify.get('/api/osint/feed', async () => {
    const logs = osintIngestionService.getLogs();
    return {
      success: true,
      count: logs.length,
      autoRunning: osintIngestionService.isAutoRunning(),
      data: logs,
    };
  });

  /**
   * POST /api/osint/auto/toggle
   * Active ou désactive le bot de simulation périodique
   */
  fastify.post('/api/osint/auto/toggle', async () => {
    if (osintIngestionService.isAutoRunning()) {
      osintIngestionService.stopAutoSimulation();
    } else {
      osintIngestionService.startAutoSimulation(45000); // Toutes les 45s
    }

    return {
      success: true,
      autoRunning: osintIngestionService.isAutoRunning(),
    };
  });
};
