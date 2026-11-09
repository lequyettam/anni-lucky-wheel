<?php

$mysql = [
    'driver' => 'mariadb', 'host' => env('DB_HOST', '127.0.0.1'), 'port' => env('DB_PORT', '3306'),
    'database' => env('DB_DATABASE', 'anni_game'), 'username' => env('DB_USERNAME', 'anni_game'),
    'password' => env('DB_PASSWORD', ''), 'unix_socket' => env('DB_SOCKET', ''),
    'charset' => 'utf8mb4', 'collation' => 'utf8mb4_unicode_ci', 'prefix' => '', 'prefix_indexes' => true,
    'strict' => true, 'engine' => 'InnoDB', 'timezone' => '+00:00',
    'options' => extension_loaded('pdo_mysql') && env('MYSQL_ATTR_SSL_CA') ? [PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'), PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => true] : [],
];

return [
    'default' => env('DB_CONNECTION', 'mariadb'),
    'connections' => ['mariadb' => $mysql, 'mysql' => array_replace($mysql, ['driver' => 'mysql']),
        'sqlite' => ['driver' => 'sqlite', 'database' => env('DB_DATABASE', database_path('database.sqlite')), 'prefix' => '', 'foreign_key_constraints' => true, 'busy_timeout' => 5000]],
    'migrations' => ['table' => 'migrations', 'update_date_on_publish' => true],
];
