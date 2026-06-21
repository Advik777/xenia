'use client';

import { createClient } from '@/lib/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface ApiError extends Error {
  status: number;
  code?: string;
}

/**
 * Authenticated fetch to the Express backend. Attaches the current Supabase
 * access token as a Bearer header. Throws ApiError (with status + code) on
 * non-2xx so callers can branch on 401/402/429.
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* empty / non-json body */
  }

  if (!res.ok) {
    const data = body as { error?: string; code?: string; detail?: string } | null;
    // In dev the backend includes a `detail` field with the underlying cause.
    const msg = data?.detail
      ? `${data.error ?? `Request failed (${res.status})`} — ${data.detail}`
      : data?.error ?? `Request failed (${res.status})`;
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }

  return body as T;
}

// ---- Typed response shapes -------------------------------------------------

export interface Finding {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  rough_location:
    | 'top-left'
    | 'top-right'
    | 'center'
    | 'bottom-left'
    | 'bottom-right'
    | 'full-image';
}

export interface ScanReport {
  risk_level: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  summary: string;
  findings: Finding[];
}

export interface AnalyzeResponse {
  tier: 'free' | 'paid';
  report: ScanReport;
  cost_deducted: number;
  remaining_balance: number | null;
  credits_exhausted?: boolean;
  code?: string;
  gated: { save_history: boolean; download_redacted: boolean; model_switcher: boolean };
}

export interface BalanceResponse {
  tier: 'free' | 'paid';
  balance: number;
  display_name: string | null;
  email: string | null;
}

export interface ScanHistoryRow {
  id: string;
  model_used: string;
  tokens_input: number;
  tokens_output: number;
  cost_deducted: number;
  risk_level: string | null;
  created_at: string;
}
