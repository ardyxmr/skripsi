<?php

return [
    // CORS for the API. Cookie-based SPA auth, so credentials are ON and origins
    // must be an exact allow-list (the wildcard '*' is illegal with credentials).
    // /sanctum/csrf-cookie lives at the app root, not under /api, so list it too.
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
