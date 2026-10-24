import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { osintIngestionService } from '../services/osintIngestionService.js';
import { telegramScraperService } from '../services/telegramScraperService.js';
import { mediaManifService } from '../services/mediaManifService.js';

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
   * POST /api/osint/telegram/sync
   * Lance une synchronisation en direct des canaux Telegram publics (100% gratuit)
   */
  fastify.post('/api/osint/telegram/sync', async () => {
    const syncResult = await telegramScraperService.syncNow();
    return {
      success: true,
      message: `Synchronisation Telegram terminée : ${syncResult.newIngested.length} alerte(s) réelle(s) détectée(s) et géocodée(s).`,
      checkedPosts: syncResult.checkedPosts,
      newIngested: syncResult.newIngested,
    };
  });

  /**
   * GET /api/osint/telegram/status
   * Statut de la surveillance Telegram publique
   */
  fastify.get('/api/osint/telegram/status', async () => {
    return {
      success: true,
      status: telegramScraperService.getStatus(),
    };
  });

  /**
   * POST /api/osint/telegram/toggle
   * Active / Désactive la surveillance périodique en tâche de fond (toutes les 3 min)
   */
  fastify.post('/api/osint/telegram/toggle', async () => {
    const status = telegramScraperService.getStatus();
    if (status.active) {
      telegramScraperService.stopPolling();
    } else {
      telegramScraperService.startPolling(3);
    }
    return {
      success: true,
      active: !status.active,
    };
  });

  /**
   * POST /api/osint/mediamanif/sync
   * Lance une synchronisation ciblée de la source MediaManif (Paris & IDF)
   */
  fastify.post('/api/osint/mediamanif/sync', async () => {
    const syncResult = await mediaManifService.syncNow();
    return {
      success: syncResult.success,
      message: syncResult.success
        ? `Synchronisation MediaManif terminée : ${syncResult.parisFiltered} points parisiens traités (${syncResult.newCreated} créés, ${syncResult.clusteredMerged} fusionnés à 50m).`
        : `Échec de synchronisation : ${syncResult.error}`,
      result: syncResult,
    };
  });

  /**
   * GET /api/osint/mediamanif/status
   * Statut de la tâche de fond MediaManif (cron horaire)
   */
  fastify.get('/api/osint/mediamanif/status', async () => {
    return {
      success: true,
      status: mediaManifService.getStatus(),
    };
  });

  /**
   * POST /api/osint/mediamanif/toggle
   * Active ou désactive le cron horaire de MediaManif
   */
  fastify.post('/api/osint/mediamanif/toggle', async () => {
    const status = mediaManifService.getStatus();
    if (status.active) {
      mediaManifService.stopPolling();
    } else {
      mediaManifService.startPolling(60);
    }
    return {
      success: true,
      active: !status.active,
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
