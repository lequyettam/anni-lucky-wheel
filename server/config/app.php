<?php

return [
    'name' => env('APP_NAME', 'ANNI Lucky Wheel'), 'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false), 'url' => env('APP_URL', 'https://game.annicoffeecamau.com'),
    'timezone' => 'UTC', 'locale' => 'vi', 'fallback_locale' => 'en', 'faker_locale' => 'vi_VN',
    'key' => env('APP_KEY'), 'cipher' => 'AES-256-CBC', 'previous_keys' => [],
    'maintenance' => ['driver' => 'file'],
];
