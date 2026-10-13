import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from server/.env, current cwd, or parent .env/.env.local
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env'),
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(__dirname, '../../../.env'),
];
for (const envPath of envPaths) {
  dotenv.config({ path: envPath });
}

const envSchema = z.object({
  BHARATSTOCK_API_KEY: z.string().min(1, 'BHARATSTOCK_API_KEY is required'),
  BHARATSTOCK_BASE_URL: z.string().url().default('https://bharatstockapi.com'),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  AI_PROVIDER: z.enum(['none', 'gemini', 'openai', 'anthropic']).default('none'),
  AI_API_KEY: z.string().optional(),
});

function loadConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`[PickMyStock Config Error] Invalid environment configuration:\n${issues}`);
    // Fall back to safe defaults if key is missing in development/test
    return {
      BHARATSTOCK_API_KEY: process.env.BHARATSTOCK_API_KEY || '',
      BHARATSTOCK_BASE_URL: process.env.BHARATSTOCK_BASE_URL || 'https://bharatstockapi.com',
      PORT: Number(process.env.PORT) || 5000,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
      DATABASE_URL: process.env.DATABASE_URL,
      AI_PROVIDER: (process.env.AI_PROVIDER as 'none' | 'gemini' | 'openai' | 'anthropic') || 'none',
      AI_API_KEY: process.env.AI_API_KEY,
    };
  }
  return parsed.data;
}

export const env = loadConfig();

/**
 * Returns safe environment configuration without exposing any secret or API key.
 */
export function getSafeConfig() {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    hasBharatStockKey: Boolean(env.BHARATSTOCK_API_KEY && env.BHARATSTOCK_API_KEY.length > 5),
    hasDatabaseUrl: Boolean(env.DATABASE_URL),
    aiProvider: env.AI_PROVIDER,
    hasAiKey: Boolean(env.AI_API_KEY && env.AI_API_KEY.length > 5),
  };
}
