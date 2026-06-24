import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

// Reverb client with a COOKIE-based authorizer. Created lazily (after login) so we never open a
// socket on the login screen. Channel auth rides the Sanctum session cookie — no bearer token.

window.Pusher = Pusher;

let echo = null;

// Same host as the API → POST /api/broadcasting/auth (auth:sanctum guarded, see bootstrap/app.php).
const AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`;

export function connectEcho() {
  if (echo) return echo;
  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    // Default to the page's own origin so the WS rides the Vite /app proxy in dev (single forwarded
    // port) and nginx's /app rule in prod. Env vars still override for a direct connection if set.
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || Number(window.location.port) || (window.location.protocol === 'https:' ? 443 : 80),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || Number(window.location.port) || 443,
    forceTLS: window.location.protocol === 'https:',
    enabledTransports: ['ws', 'wss'],

    // Custom authorizer using a RAW axios call (NOT the app `api` instance) so its humps response-
    // camelizer never rewrites Reverb's `{ auth, channel_data }` payload (channel_data → channelData
    // would break presence). withCredentials sends the session cookie; withXSRFToken attaches the
    // X-XSRF-TOKEN header from the XSRF-TOKEN cookie for the stateful POST.
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        axios.post(
          AUTH_URL,
          { socket_id: socketId, channel_name: channel.name },
          { withCredentials: true, withXSRFToken: true },
        )
          .then((res) => callback(null, res.data))
          .catch((err) => callback(err, null));
      },
    }),
  });
  return echo;
}

export function getEcho() {
  return echo;
}

export function disconnectEcho() {
  if (echo) {
    echo.disconnect();
    echo = null;
  }
}
