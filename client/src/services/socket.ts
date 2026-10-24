import { io, Socket } from 'socket.io-client';

// Utilise le même domaine ou fallback sur le port local 4000
const metaEnv = (import.meta as any).env;
const SOCKET_URL = metaEnv?.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : '/'
);

/**
 * Socket.IO configuré pour résister aux mises en veille du Free Tier Render
 * avec reconnexion continue et backoff exponentiel.
 */
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity, // Tente indéfiniment (résistance Render wake-up)
  reconnectionDelay: 1000,        // Début à 1 seconde
  reconnectionDelayMax: 10000,    // Plafonne à 10 secondes max
  randomizationFactor: 0.5,       // Jitter aléatoire pour éviter les tempêtes de connexion
  timeout: 20000,
  transports: ['websocket', 'polling'],
});

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export const initSocketListeners = (
  onStatusChange: (status: ConnectionStatus) => void
) => {
  socket.on('connect', () => {
    console.log('[Socket.IO] Connecté au serveur MaParis:', socket.id);
    onStatusChange('connected');
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Déconnecté du serveur:', reason);
    if (reason === 'io server disconnect') {
      socket.connect();
    }
    onStatusChange('disconnected');
  });

  socket.on('connect_error', (error) => {
    console.warn('[Socket.IO] Tentative de connexion en cours...', error.message);
    onStatusChange('reconnecting');
  });

  // Événements du gestionnaire de reconnexion
  socket.io.on('reconnect_attempt', (attempt) => {
    console.log(`[Socket.IO] Reconnexion au serveur (tentative #${attempt})...`);
    onStatusChange('reconnecting');
  });

  socket.io.on('reconnect', () => {
    console.log('[Socket.IO] Reconnexion réussie !');
    onStatusChange('connected');
  });
};
