import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((val) => parseInt(val, 10)),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  BAN_API_URL: z.string().default('https://api-adresse.data.gouv.fr'),
  SUPABASE_URL: z.string().optional().default(''),
  SUPABASE_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  MEDIAMANIF_POLL_INTERVAL_MIN: z.string().default('60').transform((val) => parseInt(val, 10)),
});

export const env = envSchema.parse(process.env);
