<?php

return [
    'driver' => env('SESSION_DRIVER', 'database'), 'lifetime' => (int) env('SESSION_LIFETIME', 480), 'expire_on_close' => false,
    'encrypt' => true, 'files' => storage_path('framework/sessions'), 'connection' => null, 'table' => 'sessions', 'store' => null,
    'lottery' => [2, 100], 'cookie' => env('SESSION_COOKIE', 'anni_game_session'), 'path' => '/', 'domain' => null,
    'secure' => (bool) env('SESSION_SECURE_COOKIE', true), 'http_only' => true, 'same_site' => 'lax', 'partitioned' => false,
    'block' => true, 'block_store' => env('CACHE_STORE', 'database'), 'block_lock_seconds' => 15, 'block_wait_seconds' => 15,
];
