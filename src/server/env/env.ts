import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  FOUNDER_SEED_EMAIL: z.string().email().optional(),
  FOUNDER_SEED_PASSWORD: z.string().min(12).optional(),
  OPERATIONS_SEED_EMAIL: z.string().email().optional(),
  OPERATIONS_SEED_PASSWORD: z.string().min(12).optional(),
  UPLOADTHING_TOKEN: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
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
