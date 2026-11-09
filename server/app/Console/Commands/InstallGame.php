<?php

namespace App\Console\Commands;

use App\Domain\IdentityService;
use App\Domain\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

final class InstallGame extends Command
{
    protected $signature = 'anni:install';

    protected $description = 'Initialize a paused campaign and its first administrator (interactive CLI only)';

    public function handle(): int
    {
        if (DB::table('staff_accounts')->exists() || DB::table('campaigns')->exists()) {
            $this->error('Đã khởi tạo. Lệnh không ghi đè dữ liệu.');

            return 1;
        }
        $name = $this->ask('Tên quản trị viên');
        $username = strtolower(trim($this->ask('Tên đăng nhập')));
        $password = $this->secret('Mật khẩu riêng cho hệ thống này (ít nhất 12 ký tự)');
        if (! is_string($password) || mb_strlen($password) < 12 || mb_strlen($password) > 128) {
            $this->error('Mật khẩu cần 12–128 ký tự.');

            return 1;
        }
        if ($password !== $this->secret('Nhập lại mật khẩu')) {
            $this->error('Hai mật khẩu chưa khớp.');

            return 1;
        }
        try {
            $entry = IdentityService::normalizedStaff(['name' => $name, 'username' => $username, 'password' => $password, 'role' => 'admin', 'permissions' => [], 'active' => true]);
        } catch (ValidationException $e) {
            $this->error(implode(' ', array_merge(...array_values($e->errors()))));

            return 1;
        }
        DB::transaction(function () use ($entry, $password) {
            // The primary key also prevents two simultaneous installs from both succeeding.
            $defaults = Store::decode(file_get_contents(resource_path('game/defaults.json')));
            DB::table('campaigns')->insert(['id' => 1, 'settings' => Store::json($defaults['settings']), 'prizes_revision' => 0, 'revision' => 1]);
            foreach ($defaults['prizes'] as $i => $p) {
                DB::table('prizes')->insert(['id' => $p['id'], 'position' => $i, 'active' => true, 'kind' => $p['kind'], 'weight' => $p['weight'], 'stock' => $p['stock'], 'payload' => Store::json($p)]);
            }
            $id = Store::id();
            DB::table('staff_accounts')->insert($entry + ['id' => $id, 'password' => Hash::make($password), 'version' => 1, 'created_at' => now()]);
            Store::audit(null, 'setup', $id, $entry['name']);
        });
        $this->info('Đã khởi tạo. Chiến dịch đang tạm dừng, quà tồn 0, chưa có mã cấp lượt. Đăng nhập quản trị để cấu hình trước khi mở.');

        return 0;
    }
}
