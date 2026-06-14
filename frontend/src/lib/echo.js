import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';
import { getToken } from './auth';

// Phase 5 (Step 1b): Reverb client with a bearer-token authorizer. Created lazily (after login)
// so we never open a socket on the login screen. The poller/consumers are wired in later phases;
// for now this only exists to prove the Sanctum channel-auth handshake.

window.Pusher = Pusher;

let echo = null;

// Same host as the API → POST /api/broadcasting/auth (auth:sanctum guarded, see bootstrap/app.php).
const AUTH_URL = `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`;

export function connectEcho() {
  if (echo) return echo;
  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],

    // Custom authorizer = the cookie-trap bypass. We send the bearer token in the header and use a
    // RAW axios call (NOT the app `api` instance) so its humps response-camelizer never rewrites
    // Reverb's `{ auth, channel_data }` payload (channel_data → channelData would break presence).
    authorizer: (channel) => ({
      authorize: (socketId, callback) => {
        axios.post(
          AUTH_URL,
          { socket_id: socketId, channel_name: channel.name },
          { headers: { Authorization: `Bearer ${getToken()}` } },
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
