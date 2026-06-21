import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load `.env` from backend/ first, then repo root (../.env) so secrets work
// whether you run from `backend/` or keep a single root-level `.env`.
const __configDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__configDir, '../../.env') });
dotenv.config({ path: path.resolve(__configDir, '../../../.env') });

/**
 * Centralised, validated environment. We fail fast at boot if a required
 * secret is missing or malformed — never silently run with a half-configured
 * payment/credential surface.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  CORS_ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  // Supabase — optional so the server can start without them; auth/DB calls
  // will fail at runtime if unset (clear error at call site).
  SUPABASE_URL: z.string().url().optional().default('https://placeholder.supabase.co').transform((s) => s.trim()),
  SUPABASE_ANON_KEY: z.string().min(1).optional().default('MISSING').transform((s) => s.trim()),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional().default('MISSING').transform((s) => s.trim()),

  // Legacy / fallback vision keys. Now OPTIONAL: free users get on-device
  // metadata extraction (no server call), and every paid ("credit") + admin
  // scan goes through CREDIT_API_KEY_OPENROUTER below.
  NVIDIA_NIM_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),

  // The OpenRouter key that BILLS all paid ("credit") and admin scans. Optional
  // so the server can boot; vision scans will fail at runtime if unset.
  CREDIT_API_KEY_OPENROUTER: z.string().min(1).optional().default('MISSING'),
  // The single upstream model served to credit users and the admin. Overrides
  // the per-model openrouterSlug at call time (see services/vision.ts).
  MODEL_API_USERS_OPENROUTER: z.string().min(1).default('anthropic/claude-opus-4.8'),

  // Stripe — optional so the server can boot; checkout/webhook will fail at
  // runtime if unset.
  STRIPE_SECRET_KEY: z.string().min(1).optional().default('MISSING'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional().default('MISSING'),
  STRIPE_PRICE_ID: z.string().min(1).optional().default('MISSING'),
  CREDITS_GRANTED_USD: z.coerce.number().positive().default(5.0),

  APP_URL: z.string().url().default('http://localhost:3000'),
  SUPPORT_EMAIL: z.string().email().default('aegiswheil@gmail.com'),

  // The single admin account. This Google identity gets unlimited, free access
  // to the paid vision model (it rides on CREDIT_API_KEY_OPENROUTER) and is
  // never charged or credit-gated. Everyone else follows the $10 pay-as-you-go
  // credit flow.
  ADMIN_EMAIL: z.string().email().default('aegiswheil@gmail.com'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Print which keys are wrong without leaking their values.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // eslint-disable-next-line no-console
  console.error(`\n✗ Invalid backend environment:\n${issues}\n`);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

// --- Boot-time warnings for missing keys --------------------------------
const _missing: string[] = [];
if (env.SUPABASE_ANON_KEY === 'MISSING') _missing.push('SUPABASE_ANON_KEY');
if (env.SUPABASE_SERVICE_ROLE_KEY === 'MISSING') _missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (env.CREDIT_API_KEY_OPENROUTER === 'MISSING') _missing.push('CREDIT_API_KEY_OPENROUTER');
if (env.STRIPE_SECRET_KEY === 'MISSING') _missing.push('STRIPE_SECRET_KEY');
if (env.STRIPE_WEBHOOK_SECRET === 'MISSING') _missing.push('STRIPE_WEBHOOK_SECRET');
if (env.STRIPE_PRICE_ID === 'MISSING') _missing.push('STRIPE_PRICE_ID');
if (_missing.length) {
  // eslint-disable-next-line no-console
  console.warn(
    `\n⚠ Server starting with ${_missing.length} missing key(s):\n` +
      _missing.map((k) => `  • ${k}`).join('\n') +
      '\n  Set them in Render → Environment Variables to enable full functionality.\n',
  );
}
