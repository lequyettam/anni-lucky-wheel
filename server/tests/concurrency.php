<?php

use App\Domain\Store;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Process\Process;

// Destructive only to the explicitly named disposable test database. No production credentials.
require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! app()->environment('testing') || config('database.default') !== 'mariadb' || config('database.connections.mariadb.database') !== 'anni_game_test') {
    throw new RuntimeException('Requires testing + mariadb + anni_game_test');
}
Artisan::call('migrate:fresh', ['--force' => true]);
$defaults = Store::decode(file_get_contents(resource_path('game/defaults.json')));
$defaults['settings']['active'] = true;
$defaults['settings']['dailyFree'] = 10;
DB::table('campaigns')->insert(['id' => 1, 'settings' => Store::json($defaults['settings']), 'revision' => 1]);
$prizes = [['id' => 'lose', 'name' => 'Hẹn lần sau', 'short' => 'Hẹn', 'kind' => 'lose', 'weight' => 0, 'stock' => null, 'days' => 7], ['id' => 'win', 'name' => 'Cà phê', 'short' => 'Cà phê', 'kind' => 'drink', 'weight' => 10000, 'stock' => 1, 'days' => 7, 'codeMode' => 'imported', 'codeMessage' => 'Dùng #mã']];
foreach ($prizes as $i => $p) {
    DB::table('prizes')->insert(['id' => $p['id'], 'position' => $i, 'active' => true, 'kind' => $p['kind'], 'weight' => $p['weight'], 'stock' => $p['stock'], 'payload' => Store::json($p)]);
}
DB::table('voucher_keys')->insert(['code_key' => 'LAST01', 'original' => 'Last01', 'kind' => 'imported', 'prize_id' => 'win']);
$customer = Store::id();
DB::table('customers')->insert(['id' => $customer, 'phone' => '0900000001', 'name' => 'Concurrent test', 'recovery_hash' => Hash::make('testing-only'), 'created_at' => now()]);
function parallel(array $jobs): array
{
    $running = [];
    foreach ($jobs as $job) {
        $process = new Process([PHP_BINARY, __DIR__.'/concurrency-worker.php', ...$job]);
        $process->setTimeout(30);
        $process->start();
        $running[] = $process;
    }
    $result = [];
    foreach ($running as $process) {
        $process->wait();
        if (! $process->isSuccessful()) {
            throw new RuntimeException($process->getErrorOutput());
        }$value = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR);
        $result[] = $value;
    }

    return $result;
}
$results = parallel(array_map(fn ($i) => ['spin', $customer, 'concurrent-request-'.str_pad((string) $i, 8, '0', STR_PAD_LEFT)], range(1, 6)));
if (count(array_filter($results, fn ($r) => $r['ok'])) !== 1 || DB::table('vouchers')->count() !== 1 || DB::table('spins')->count() !== 1 || (int) DB::table('prizes')->where('id', 'win')->value('stock') !== 0) {
    throw new RuntimeException('Last-prize race failed');
}
$voucher = DB::table('vouchers')->first();
$results = parallel([['redeem', $customer, $voucher->code], ['redeem', $customer, 'last01']]);
if (count(array_filter($results, fn ($r) => $r['ok'])) !== 1 || DB::table('redemptions')->count() !== 1) {
    throw new RuntimeException('Redemption race failed');
}
// Repeating the successful spin ID returns its existing result with no new allocation.
$request = DB::table('spins')->first()->request_id;
$results = parallel([['spin', $customer, $request], ['spin', $customer, $request]]);
if (count(array_filter($results, fn ($r) => $r['ok'])) !== 2 || DB::table('spins')->count() !== 1 || DB::table('vouchers')->count() !== 1) {
    throw new RuntimeException('Retry race failed');
}
echo "PASS: last prize (6 workers), one redemption (2 workers), idempotent retries (2 workers)\n";
