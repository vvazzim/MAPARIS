import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { healthRoutes } from './routes/health.js';
import { incidentRoutes } from './routes/incidents.js';
import { geocodeRoutes } from './routes/geocode.js';
import { osintRoutes } from './routes/osint.js';
import { routingRoutes } from './routes/routing.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'development' ? 'info' : 'warn',
      // Sécurité Zéro-Log : Anonymisation stricte des adresses IP et en-têtes
      redact: {
        paths: [
          'req.remoteAddress',
          'req.remotePort',
          'req.headers["x-forwarded-for"]',
          'req.headers["x-real-ip"]',
          'req.headers.cookie',
          'req.headers.authorization',
        ],
        censor: '[ANONYMIZED]',
      },
    },
  });

  // Protection Anti-Flood
  await app.register(rateLimit, {
    global: false,
  });

  // Configuration CORS pour autoriser le frontend Vite
  await app.register(cors, {
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enregistrement des routes REST API
  await app.register(healthRoutes);
  await app.register(incidentRoutes);
  await app.register(geocodeRoutes);
  await app.register(osintRoutes);
  await app.register(routingRoutes);

  // Déploiement unifié : si le build Vite du frontend existe, Fastify le sert directement
  const distCandidates = [
    path.resolve(process.cwd(), '..', 'client', 'dist'),
    path.resolve(process.cwd(), 'client', 'dist'),
    path.resolve(process.cwd(), 'dist'),
  ];
  const foundDist = distCandidates.find((dir) => fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html')));

  if (foundDist) {
    await app.register(fastifyStatic, {
      root: foundDist,
      prefix: '/',
      wildcard: false,
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.raw.url && request.raw.url.startsWith('/api')) {
        return reply.status(404).send({ status: 'error', error: 'Endpoint API introuvable' });
      }
      return reply.sendFile('index.html');
    });
  }

  return app;
}
