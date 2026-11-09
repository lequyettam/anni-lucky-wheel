<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class Doctor extends Command
{
    protected $signature = 'anni:doctor';

    protected $description = 'Check runtime and database without printing credentials';

    public function handle(): int
    {
        $failed = false;
        foreach (['pdo_mysql', 'mbstring', 'openssl', 'fileinfo', 'gd', 'ctype', 'dom', 'xml', 'tokenizer', 'curl'] as $ext) {
            $ok = extension_loaded($ext);
            $this->line($ext.': '.($ok ? 'OK' : 'MISSING'));
            $failed |= ! $ok;
        }
        foreach (['storage' => storage_path(), 'bootstrap/cache' => base_path('bootstrap/cache')] as $label => $path) {
            $ok = is_writable($path);
            $this->line($label.': '.($ok ? 'writable' : 'NOT WRITABLE'));
            $failed |= ! $ok;
        }
        $ok = (bool) config('app.key');
        $failed |= ! $ok;
        $this->line('APP_KEY: '.($ok ? 'set' : 'missing'));
        $ok = in_array('argon2id', password_algos(), true);
        $failed |= ! $ok;
        $this->line('Argon2id: '.($ok ? 'available' : 'MISSING; enable PHP Argon2 support'));
        try {
            DB::connection()->getPdo();
            $this->info('Database: connected');
            $ok = DB::table('campaigns')->where('id', 1)->exists();
            $failed |= ! $ok;
            $this->line('Campaign: '.($ok ? 'initialized' : 'run anni:install'));
        } catch (\Throwable) {
            $this->error('Database/migrations unavailable. Check local configuration and server logs.');
            $failed = true;
        }
        if (app()->environment('production') && (config('app.debug') || ! config('session.secure'))) {
            $failed = true;
            $this->error('Production requires APP_DEBUG=false and SESSION_SECURE_COOKIE=true.');
        }

        return $failed ? 1 : 0;
    }
}
