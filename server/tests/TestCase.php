<?php

namespace Tests;

use App\Domain\Access;
use App\Domain\Store;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

abstract class TestCase extends \Illuminate\Foundation\Testing\TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = require __DIR__.'/../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();
        $db = config('database.connections.'.config('database.default').'.database');
        if (! in_array($db, [':memory:', 'anni_game_test'], true)) {
            throw new \RuntimeException('Tests require :memory: or the dedicated anni_game_test database.');
        }

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        config(['hashing.argon.memory' => 1024, 'hashing.argon.time' => 1]);
        $defaults = Store::decode(file_get_contents(resource_path('game/defaults.json')));
        $defaults['settings']['active'] = true;
        $defaults['settings']['dailyFree'] = 10;
        DB::table('campaigns')->insert(['id' => 1, 'settings' => Store::json($defaults['settings']), 'revision' => 1, 'prizes_revision' => 0]);
        foreach ($this->prizes() as $i => $p) {
            $codes = $p['voucherCodes'] ?? [];
            unset($p['voucherCodes']);
            DB::table('prizes')->insert(['id' => $p['id'], 'position' => $i, 'active' => true, 'kind' => $p['kind'], 'weight' => $p['weight'], 'stock' => $p['stock'], 'payload' => Store::json($p)]);
            foreach ($codes as $code) {
                DB::table('voucher_keys')->insert(['code_key' => strtoupper($code), 'original' => $code, 'kind' => 'imported', 'prize_id' => $p['id']]);
            }
        }
    }

    protected function prizes(): array
    {
        return [
            ['id' => 'luck', 'name' => 'Hẹn lần sau', 'short' => 'Hẹn lần sau', 'kind' => 'lose', 'weight' => 0, 'stock' => null, 'days' => 7, 'color' => '#294D40', 'icon' => 'leaf', 'terms' => 'Hẹn gặp lại', 'image' => '', 'codeMode' => 'automatic', 'voucherCodes' => [], 'codeMessage' => ''],
            ['id' => 'coffee', 'name' => 'Tặng cà phê', 'short' => 'Cà phê', 'kind' => 'drink', 'weight' => 10000, 'stock' => 2, 'days' => 7, 'color' => '#D5B886', 'icon' => 'cup', 'terms' => 'Một ly tại quầy', 'image' => '', 'codeMode' => 'imported', 'voucherCodes' => ['AU79j090', 'SI9806'], 'codeMessage' => 'Dùng #mã tại quầy'],
        ];
    }

    protected function customer(string $phone = '0900000001'): string
    {
        $id = Store::id();
        DB::table('customers')->insert(['id' => $id, 'phone' => $phone, 'name' => 'Khách kiểm tra', 'recovery_hash' => Hash::make('ANNI-TEST-RECOVERY'), 'created_at' => now()]);
        $this->withSession(['customer' => ['id' => $id, 'expires' => time() + 3600]]);

        return $id;
    }

    protected function staff(string $role = 'admin', ?array $permissions = null): string
    {
        $id = Store::id();
        $permissions ??= $role === 'admin' ? Access::PERMISSIONS : ($role === 'cashier' ? ['vouchers.view', 'vouchers.redeem'] : ['vouchers.view']);
        DB::table('staff_accounts')->insert(['id' => $id, 'name' => 'Nhân viên kiểm tra', 'username' => 'user'.substr(str_replace('-', '', $id), 0, 12), 'password' => Hash::make('Testing-only-password!'), 'role' => $role, 'permissions' => Store::json($permissions), 'active' => true, 'version' => 1, 'created_at' => now()]);
        $this->withSession(['staff' => ['id' => $id, 'version' => 1, 'expires' => time() + 3600]]);

        return $id;
    }

    protected function spin(string $request = 'request-test-00000001')
    {
        return $this->postJson('/api/spin', ['source' => 'free', 'requestId' => $request]);
    }
}
