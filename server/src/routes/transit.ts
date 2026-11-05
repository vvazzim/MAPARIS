import { FastifyPluginAsync } from 'fastify';
import { transitService, normalizeLineKey, getLineStyle, RATP_LINES_METADATA } from '../services/transitService.js';

export const transitRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /api/transit/time
   * Horloge de référence officielle du serveur pour alignement parfait à la milliseconde
   */
  fastify.get('/api/transit/time', async () => {
    return {
      success: true,
      ...transitService.getServerTime(),
    };
  });

  /**
   * GET /api/transit/departures
   * Départs en temps réel synchronisés pour un arrêt et ses lignes
   */
  fastify.get<{
    Querystring: {
      stationId?: string;
      lines?: string;
      status?: 'normal' | 'disrupted' | 'closed';
      mode?: 'all' | 'metro' | 'rer' | 'train' | 'tram' | 'bus';
    };
  }>('/api/transit/departures', async (request, reply) => {
    const { stationId, lines, status = 'normal', mode = 'all' } = request.query;

    if (!stationId) {
      return reply.status(400).send({
        success: false,
        error: 'Le paramètre stationId est obligatoire.',
      });
    }

    const linesList = lines ? lines.split(',').map((l) => l.trim()).filter(Boolean) : [];

    const departures = transitService.getRealtimeDepartures(
      stationId,
      linesList,
      status,
      mode
    );

    return {
      success: true,
      stationId,
      serverTime: Date.now(),
      departuresCount: departures.length,
      departures,
    };
  });

  /**
   * GET /api/transit/lines
   * Métadonnées et couleurs officielles des lignes de transport
   */
  fastify.get('/api/transit/lines', async () => {
    const lines = Object.entries(RATP_LINES_METADATA).map(([key, meta]) => ({
      key,
      name: meta.name,
      type: meta.type,
      bg: meta.bg,
      text: meta.text,
      directions: meta.directions,
      peakHeadwayMin: meta.peakHeadwayMin,
      offPeakHeadwayMin: meta.offPeakHeadwayMin,
    }));

    return {
      success: true,
      linesCount: lines.length,
      lines,
    };
  });

  /**
   * GET /api/transit/style/:lineKey
   * Récupère le style graphique officiel d'une ligne
   */
  fastify.get<{
    Params: {
      lineKey: string;
    };
  }>('/api/transit/style/:lineKey', async (request) => {
    const { lineKey } = request.params;
    const style = getLineStyle(lineKey);
    return {
      success: true,
      ...style,
    };
  });
};
