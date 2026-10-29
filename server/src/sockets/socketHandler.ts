import { Server, Socket } from 'socket.io';
import { incidentRepository } from '../repositories/incidentRepository.js';
import { Incident } from '../types/index.js';

let ioInstance: Server | null = null;

export function setupSocketIO(io: Server) {
  ioInstance = io;

  io.on('connection', async (socket: Socket) => {
    console.log(`[Socket.IO] Client connecté: ${socket.id}`);

    try {
      // Envoi du flux initial des incidents au client qui vient de se connecter
      const activeIncidents = await incidentRepository.getAll({ limit: 50 });
      socket.emit('incidents:init', activeIncidents);
    } catch (err: any) {
      console.error('[Socket.IO] Erreur envoi incidents initiaux:', err.message);
    }

    // Ping / Pong pour monitoring de latence
    socket.on('client:ping', () => {
      socket.emit('server:pong', { timestamp: Date.now() });
    });

    // Permet au client de souscrire à un incident particulier
    socket.on('incident:subscribe', (incidentId: string) => {
      socket.join(`incident:${incidentId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client déconnecté (${socket.id}): ${reason}`);
    });
  });

  // Tâche de fond périodique : Nettoyage TTL et notification WebSocket temps réel
  const cleanupTimer = setInterval(async () => {
    try {
      const expiredIds = await incidentRepository.cleanupExpired();
      if (expiredIds.length > 0 && ioInstance) {
        expiredIds.forEach((id) => {
          ioInstance!.emit('incident:expired', { id });
        });
      }
    } catch (err: any) {
      console.error('[Socket.IO] Erreur broadcast cleanup:', err.message);
    }
  }, 30000);
  if (cleanupTimer && typeof cleanupTimer.unref === 'function') {
    cleanupTimer.unref();
  }
}

/**
 * Diffuse un nouvel incident en temps réel à l'ensemble des clients connectés
 */
export function broadcastNewIncident(incident: Incident) {
  if (ioInstance) {
    console.log(`[Socket.IO] Diffusion nouvel incident [${incident.id}] "${incident.location_name}"`);
    ioInstance.emit('incident:new', incident);
  }
}

/**
 * Diffuse une mise à jour d'incident (ex: clustering 50m, nouvel upvote ou modération)
 */
export function broadcastIncidentUpdated(incident: Incident) {
  if (ioInstance) {
    console.log(`[Socket.IO] Diffusion mise à jour incident [${incident.id}] (Reports: ${incident.reports_count})`);
    ioInstance.emit('incident:updated', incident);
    ioInstance.to(`incident:${incident.id}`).emit('incident:details_updated', incident);
  }
}

/**
 * Diffuse la suppression/expiration d'un incident
 */
export function broadcastIncidentExpired(id: string) {
  if (ioInstance) {
    console.log(`[Socket.IO] Diffusion expiration incident [${id}]`);
    ioInstance.emit('incident:expired', { id });
  }
}

export function getIO(): Server | null {
  return ioInstance;
}
