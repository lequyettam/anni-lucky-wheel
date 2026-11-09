<?php

namespace App\Domain;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class Access
{
    public const PERMISSIONS = ['overview.view', 'vouchers.view', 'vouchers.redeem', 'prizes.view', 'prizes.edit', 'codes.view', 'codes.edit', 'reports.view', 'reports.export', 'themes.view', 'themes.edit', 'content.view', 'content.edit', 'settings.view', 'settings.edit', 'staff.manage'];

    public static function staffData(object $s): array
    {
        return ['id' => $s->id, 'name' => $s->name, 'username' => $s->username, 'role' => $s->role,
            'permissions' => $s->role === 'admin' ? self::PERMISSIONS : Store::decode($s->permissions), 'active' => (bool) $s->active, 'sessionVersion' => (int) $s->version,
            'createdAt' => Store::iso($s->created_at), 'lastLoginAt' => Store::iso($s->last_login_at)];
    }

    public static function staff(Request $r): ?array
    {
        $session = $r->session()->get('staff');
        if (! $session || ($session['expires'] ?? 0) <= time()) {
            return null;
        }
        $s = DB::table('staff_accounts')->where('id', $session['id'])->first();

        return $s && $s->active && (int) $s->version === $session['version'] ? self::staffData($s) : null;
    }

    public static function can(?array $staff, string $permission): bool
    {
        return $staff && $staff['active'] && in_array($permission, $staff['permissions'], true);
    }

    public static function require(Request $r, string $permission): array
    {
        $staff = self::staff($r);
        abort_unless($staff, 401, 'Phiên nhân viên đã kết thúc. Vui lòng đăng nhập lại.');
        abort_unless(self::can($staff, $permission), 403, 'Tài khoản không có quyền thực hiện thao tác này.');

        return $staff;
    }

    public static function customer(Request $r, bool $required = true): ?object
    {
        $session = $r->session()->get('customer');
        $user = $session && ($session['expires'] ?? 0) > time() ? DB::table('customers')->where('id', $session['id'])->first() : null;
        if ($required) {
            abort_unless($user, 401, 'Vui lòng đăng nhập ví quà.');
        }

return $user;
    }
}
