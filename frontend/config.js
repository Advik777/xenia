// ============================================================================
//  Xyris Vision — frontend runtime config
//  Fill these in to connect the live backend (Supabase auth + Express API +
//  Stripe). Leave them BLANK to run in on-device / demo mode — the app
//  works fully without a backend, it just won't do server-side credits or auth.
//  Only public values belong here. Never put a service-role / secret key in this file.
// ============================================================================
window.XENLENS_CONFIG = {
  // Base URL of the deployed Express backend (the `backend/` folder).
  // e.g. "https://xenlens-api.onrender.com"
  apiUrl: '',

  // Supabase project URL + anon (public) key — safe to expose by design.
  supabaseUrl: '',
  supabaseAnonKey: '',
};
