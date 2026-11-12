require('dotenv').config();
const { z } = require('zod');

const list = (v) => (v || '').split(',').map((s) => s.trim()).filter(Boolean);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().min(1),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  ADMIN_EMAILS: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5-5'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const e = parsed.data;

module.exports = {
  ...e,
  isProd: e.NODE_ENV === 'production',
  corsOrigins: list(e.CORS_ORIGINS),
  adminEmails: list(e.ADMIN_EMAILS).map((s) => s.toLowerCase()),
};
