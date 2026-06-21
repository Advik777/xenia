// ============================================================================
//  Xyris Vision — frontend runtime config
//
//  Production:  Vercel  → https://xyrisvision.vercel.app
//  Backend API: Render  → https://xenlens-backend.onrender.com
//
//  Only public values belong here. Never put a service-role / secret key in this file.
// ============================================================================

const PRODUCTION_API = 'https://xenlens-backend.onrender.com';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

window.XENLENS_CONFIG = {
  // Render Express API. Local dev uses localhost; Vercel production uses Render.
  apiUrl: isLocal ? 'http://localhost:4000' : PRODUCTION_API,

  // Supabase project URL + anon (public) key — safe to expose by design.
  supabaseUrl: 'https://xhsxnelygnibwhmxhwob.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhoc3huZWx5Z25pYndobXhod29iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5ODYyNzQsImV4cCI6MjA5NzU2MjI3NH0.Glf45REI9rvlniOLiCbXew4qRCXzKyeg5frHQoLDQ4E',
};
