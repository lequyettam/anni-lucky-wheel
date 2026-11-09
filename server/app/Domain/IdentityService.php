<?php

namespace App\Domain;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;

final class IdentityService
{
    private function throttle(Request $r, string $type, string $name): void
    {
        foreach ([$type.':ip:'.hash('sha256', $r->ip()), $type.':name:'.hash('sha256', strtolower($name))] as $key) {
            abort_if(RateLimiter::tooManyAttempts($key, 10), 429, 'Thao tác quá nhiều lần. Vui lòng thử lại sau ít phút.');
            RateLimiter::hit($key, 300);
        }
    }

    public function customerLogin(Request $r): array
    {
        $data = $r->validate(['phone' => 'required|string|max:24', 'recovery' => 'nullable|string|max:100', 'enrollmentKey' => 'sometimes|string|size:64|regex:/^[a-f0-9]+$/']);
        $phone = Validation::phone($data['phone']);
        $this->throttle($r, 'customer-login', $phone);
        $result = Store::transaction(function () use ($data, $phone) {
            $u = DB::table('customers')->where('phone', $phone)->first();
            $recovery = null;
            if ($u) {
                $retry = empty($data['recovery']) && ! empty($data['enrollmentKey']) && $u->enrollment_key_hash && $u->enrollment_recovery && strtotime($u->enrollment_expires_at) > time() && hash_equals($u->enrollment_key_hash, hash('sha256', $data['enrollmentKey']));
                if ($retry) {
                    $recovery = Crypt::decryptString($u->enrollment_recovery);
                } elseif (! Hash::check(strtoupper(trim($data['recovery'] ?? '')), $u->recovery_hash)) {
                    Store::fail('Thông tin đăng nhập không đúng. Ví đã tạo cần số điện thoại và mã khôi phục.');
                }
            } else {
                if (! empty($data['recovery'])) {
                    Store::fail('Thông tin đăng nhập không đúng.');
                }
                $recovery = 'ANNI-'.strtoupper(bin2hex(random_bytes(16)));
                $id = Store::id();
                DB::table('customers')->insert(['id' => $id, 'phone' => $phone, 'name' => '', 'recovery_hash' => Hash::make($recovery), 'created_at' => now(),
                    'enrollment_key_hash' => ! empty($data['enrollmentKey']) ? hash('sha256', $data['enrollmentKey']) : null,
                    'enrollment_recovery' => ! empty($data['enrollmentKey']) ? Crypt::encryptString($recovery) : null,
                    'enrollment_expires_at' => ! empty($data['enrollmentKey']) ? now()->addMinutes(5) : null]);
                $u = DB::table('customers')->where('id', $id)->first();
            }

            return ['user' => Store::customer($u), 'recoveryCode' => $recovery];
        });
        $r->session()->regenerate();
        $r->session()->put('customer', ['id' => $result['user']['id'], 'expires' => now()->addDays(config('anni.customer_session_days'))->timestamp]);

        return $result;
    }

    public function staffLogin(Request $r): bool
    {
        $data = $r->validate(['username' => 'required|string|max:32', 'password' => 'required|string|max:128']);
        $name = strtolower(trim($data['username']));
        $this->throttle($r, 'staff-login', $name);
        $staff = Store::transaction(function () use ($data, $name) {
            $s = DB::table('staff_accounts')->where('username', $name)->first();
            if (! $s || ! $s->active || ! Hash::check($data['password'], $s->password)) {
                Store::fail('Tên đăng nhập hoặc mật khẩu không đúng, hoặc tài khoản đã bị khóa.');
            }
            $update = ['last_login_at' => now()];
            if (Hash::needsRehash($s->password)) {
                $update['password'] = Hash::make($data['password']);
            }
            DB::table('staff_accounts')->where('id', $s->id)->update($update);

            return $s;
        });
        $r->session()->regenerate();
        $r->session()->put('staff', ['id' => $staff->id, 'version' => (int) $staff->version, 'expires' => now()->addHours(config('anni.staff_session_hours'))->timestamp]);

        return true;
    }

    public static function normalizedStaff(array $data): array
    {
        Validator::make($data, ['name' => 'required|string|min:2|max:80', 'username' => 'required|string|regex:/^[a-z0-9][a-z0-9._-]{2,31}$/',
            'role' => 'required|in:admin,viewer,cashier', 'permissions' => 'present|array', 'permissions.*' => 'string', 'active' => 'required|boolean',
            'password' => 'nullable|string|min:12|max:128'])->validate();
        $permissions = $data['role'] === 'admin' ? Access::PERMISSIONS : $data['permissions'];
        foreach ($permissions as $p) {
            if (! in_array($p, Access::PERMISSIONS, true) || ($data['role'] !== 'admin' && $p === 'staff.manage')) {
                Store::fail('Quyền không hợp lệ.');
            }
        }
        foreach ($permissions as $p) {
            if (str_ends_with($p, '.edit')) {
                $permissions[] = str_replace('.edit', '.view', $p);
            }if ($p === 'vouchers.redeem') {
                $permissions[] = 'vouchers.view';
            }if ($p === 'reports.export') {
                $permissions[] = 'reports.view';
            }
        }
        if (! array_filter($permissions, fn ($p) => str_ends_with($p, '.view'))) {
            Store::fail('Cần ít nhất một quyền xem.');
        }

        return ['name' => trim($data['name']), 'username' => strtolower(trim($data['username'])), 'role' => $data['role'], 'active' => $data['active'], 'permissions' => Store::json(array_values(array_unique($permissions)))];
    }

    public function saveStaff(Request $r): array
    {
        $data = $r->all();
        $entry = self::normalizedStaff($data);

        return Store::transaction(function () use ($data, $entry, $r) {
            $actor = Access::require($r, 'staff.manage');
            $existing = ! empty($data['id']) ? DB::table('staff_accounts')->where('id', $data['id'])->first() : null;
            if (! empty($data['id']) && ! $existing) {
                Store::fail('Không tìm thấy nhân viên.');
            }
            if ($existing && (int) ($data['revision'] ?? 0) !== (int) $existing->version) {
                abort(409, 'Tài khoản đã thay đổi. Hãy mở lại để chỉnh sửa.');
            }
            if (DB::table('staff_accounts')->where('username', $entry['username'])->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))->exists()) {
                Store::fail('Tên đăng nhập đã được sử dụng.');
            }
            if ($existing && $existing->active && $existing->role === 'admin' && (! $entry['active'] || $entry['role'] !== 'admin') && ! DB::table('staff_accounts')->where('id', '!=', $existing->id)->where('role', 'admin')->where('active', true)->exists()) {
                Store::fail('Cần giữ một quản trị viên đang hoạt động.');
            }
            if (! $existing && empty($data['password'])) {
                Store::fail('Cần mật khẩu cho tài khoản mới.');
            }
            if (! empty($data['password'])) {
                $entry['password'] = Hash::make($data['password']);
            }
            $entry['version'] = ($existing->version ?? 0) + 1;
            $id = $existing->id ?? Store::id();
            if ($existing) {
                DB::table('staff_accounts')->where('id', $id)->update($entry);
            } else {
                DB::table('staff_accounts')->insert($entry + ['id' => $id, 'created_at' => now()]);
            }
            Store::audit($actor, $existing ? 'update' : 'create', $id, $entry['name'], 'Cập nhật nhân viên và quyền; thu hồi phiên cũ.');

            return Access::staffData(DB::table('staff_accounts')->where('id', $id)->first());
        });
    }

    public function changePassword(Request $r): bool
    {
        $data = $r->validate(['currentPassword' => 'required|string|max:128', 'password' => 'required|string|min:12|max:128']);
        $this->throttle($r, 'password', Access::staff($r)['id'] ?? 'guest');

        return Store::transaction(function () use ($r, $data) {
            $actor = Access::staff($r);
            abort_unless($actor, 401);
            $staff = DB::table('staff_accounts')->where('id', $actor['id'])->first();
            if (! Hash::check($data['currentPassword'], $staff->password)) {
                Store::fail('Mật khẩu hiện tại không đúng.');
            }
            DB::table('staff_accounts')->where('id', $staff->id)->update(['password' => Hash::make($data['password']), 'version' => $staff->version + 1]);
            Store::audit($actor,'password',$staff->id,$staff->name);
            $r->session()->forget('staff');

            return true;
        });
    }
}
