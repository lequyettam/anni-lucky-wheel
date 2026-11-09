<?php

namespace App\Console\Commands;

use App\Domain\Store;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

final class StaffPassword extends Command
{
    protected $signature = 'anni:staff-password {username}';

    protected $description = 'Reset an existing staff password locally and revoke its sessions';

    public function handle(): int
    {
        $username = strtolower(trim($this->argument('username')));
        $staff = DB::table('staff_accounts')->where('username', $username)->first();
        if (! $staff) {
            $this->error('Không tìm thấy tài khoản.');

            return 1;
        }
        $password = $this->secret('Mật khẩu mới (ít nhất 12 ký tự)');
        if (Validator::make(['password' => $password], ['password' => 'required|string|min:12|max:128'])->fails() || $password !== $this->secret('Nhập lại mật khẩu')) {
            $this->error('Mật khẩu không hợp lệ hoặc chưa khớp.');

            return 1;
        }
        Store::transaction(function () use ($staff, $password) {
            DB::table('staff_accounts')->where('id', $staff->id)->update(['password' => Hash::make($password), 'version' => DB::raw('version + 1')]);
            Store::audit(null, 'password', $staff->id, $staff->name, 'Đặt lại bằng CLI; thu hồi phiên cũ.');
        });
        $this->info('Đã đổi mật khẩu và thu hồi phiên cũ.');

        return 0;
    }
}
