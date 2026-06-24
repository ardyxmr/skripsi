/* eslint-env node */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: proxy the API + Sanctum + storage endpoints to the Laravel backend so the browser only ever
// talks to the Vite origin (same-origin → session cookie + CSRF work with no CORS, and only the Vite
// port needs forwarding from the host/VM). The backend target is fixed here — the app uses
// VITE_API_BASE_URL as a *relative* base ("/api"), so it must NOT drive this target.
const BACKEND = process.env.BACKEND_PROXY_TARGET || 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/sanctum': { target: BACKEND, changeOrigin: true },
      '/storage': { target: BACKEND, changeOrigin: true },
      // Reverb WebSocket (pusher protocol path /app/{key}) → proxied so realtime works over the
      // single Vite port (no need to forward 8080 from the VM). Mirrors the prod nginx /app/ rule.
      // REGEX (leading ^) + trailing slash so it matches only /app/<key> — a plain '/app' prefix would
      // also swallow the SPA route /approvals (and anything starting with "app").
      '^/app/': { target: process.env.REVERB_PROXY_TARGET || 'ws://127.0.0.1:8080', ws: true, changeOrigin: true },
    },
  },
});
