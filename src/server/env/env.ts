import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  FOUNDER_SEED_EMAIL: z.string().email().optional(),
  OPERATIONS_SEED_EMAIL: z.string().email().optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  MISSION_CONTROL_WEBHOOK_URL: z.string().url().optional(),
  MISSION_CONTROL_WEBHOOK_SECRET: z.string().optional(),
  GHOST_MISSION_CONTROL_WEBHOOK_URL: z.string().url().optional(),
  GHOST_MISSION_CONTROL_WEBHOOK_SECRET: z.string().optional(),
  GHOST_MISSION_CONTROL_API_URL: z.string().url().optional(),
  GHOST_CLIENT_ID: z.string().optional(),
  GHOST_CLIENT_NAME: z.string().optional(),
  GHOST_SITE_URL: z.string().url().optional(),
  GHOST_REPO: z.string().optional(),
  GHOST_WEB_HELPER_ID: z.string().optional(),
  GHOSTCRM_CORE_API_URL: z.string().url().optional(),
  GHOSTCRM_CORE_API_KEY: z.string().optional(),
  GHOSTCRM_SYNC_URL: z.string().url().optional(),
  GHOSTCRM_API_KEY: z.string().optional(),
  GHOSTCRM_ORGANIZATION_ID: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).optional()
});

export const env = envSchema.parse(process.env);

export function requireEnv(name: keyof z.infer<typeof envSchema>) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
