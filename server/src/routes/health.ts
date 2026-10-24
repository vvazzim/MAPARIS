import { FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async () => {
    return {
      status: 'ok',
      service: 'MaParis API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });
};
