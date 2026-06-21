import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { publicModelCatalog } from '../lib/models.js';
import { env } from '../config/env.js';
import { UserErrors } from '../lib/userErrors.js';

export const userRouter = Router();

/** GET /api/user/balance — real-time tier + balance for the header/UI. */
userRouter.get(
  '/balance',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const isAdmin = (user.email ?? '').toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

    const { data } = await supabaseAdmin
      .from('profiles')
      .select('tier, virtual_balance, display_name, email')
      .eq('id', user.id)
      .single();

    // The admin always presents as a fully-unlocked paid account with an
    // effectively bottomless balance — they ride on CREDIT_API_KEY_OPENROUTER
    // for free and never see the plans / top-up screens.
    res.json({
      tier: isAdmin ? 'paid' : data?.tier ?? 'free',
      balance: isAdmin ? 999_999 : Number(data?.virtual_balance ?? 0),
      is_admin: isAdmin,
      display_name: data?.display_name ?? null,
      email: data?.email ?? user.email ?? null,
    });
  }),
);

/** GET /api/user/history — paid-tier scan history (most recent first). */
const HistoryQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

userRouter.get(
  '/history',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { limit } = HistoryQuery.parse(req.query);

    const { data, error } = await supabaseAdmin
      .from('scans')
      .select('id, model_used, tokens_input, tokens_output, cost_deducted, risk_level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(500).json({ error: UserErrors.historyFailed });
    res.json({ scans: data ?? [] });
  }),
);

/** GET /api/user/models — price-only catalog, safe for the billing page. */
userRouter.get('/models', (_req, res) => {
  res.json({ models: publicModelCatalog() });
});
