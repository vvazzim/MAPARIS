import { Server } from 'socket.io';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { setupSocketIO } from './sockets/socketHandler.js';
import { telegramScraperService } from './services/telegramScraperService.js';
import { mediaManifService } from './services/mediaManifService.js';
import { transitAutomationService } from './services/transitAutomationService.js';

async function bootstrap() {
  try {
    const app = await buildApp();

    // Attach Socket.io to Fastify HTTP server
    const io = new Server(app.server, {
      cors: {
        origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    setupSocketIO(io);

    // Start Fastify server
    await app.listen({ port: env.PORT, host: env.HOST });

    // Active la surveillance gratuite des canaux publics Telegram (toutes les 5 min)
    telegramScraperService.startPolling(5);

    // Active la synchronisation automatisée MediaManif (par défaut toutes les 60 min / 1h, configurable)
    mediaManifService.startPolling(env.MEDIAMANIF_POLL_INTERVAL_MIN);

    // Active la synchronisation automatique des Grèves, Retards & Perturbations Réseau (toutes les 5 min)
    transitAutomationService.startPolling(5);

    // Master Daily Sync : déclenchement garanti au moins une fois par 24h
    setInterval(async () => {
      console.log('🔄 [Master Daily Sync] Exécution du cycle automatique de synchronisation 24h...');
      try {
        await Promise.allSettled([
          transitAutomationService.syncDisruptionsToIncidents(),
          mediaManifService.syncNow(),
          telegramScraperService.syncNow(),
        ]);
        console.log('✅ [Master Daily Sync] Cycle 24h terminé.');
      } catch (err) {
        console.error('❌ [Master Daily Sync] Erreur lors du cycle 24h:', err);
      }
    }, 24 * 60 * 60 * 1000);

    console.log(`
=====================================================
🛡️  MAPARIS - SERVEUR DÉMARRÉ
=====================================================
📡 HTTP API:      http://${env.HOST}:${env.PORT}/api/health
⚡ WebSocket IO:  ws://${env.HOST}:${env.PORT}
💻 Client URL:    ${env.CLIENT_URL}
🌍 Environnement: ${env.NODE_ENV}
=====================================================
    `);
  } catch (err) {
    console.error('Erreur critique au démarrage du serveur:', err);
    process.exit(1);
  }
}

bootstrap();
