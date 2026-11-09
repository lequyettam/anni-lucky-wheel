<?php

namespace App\Http;

use App\Domain\Access;
use App\Domain\CampaignService;
use App\Domain\GameService;
use App\Domain\IdentityService;
use App\Domain\Snapshot;
use Illuminate\Http\Request;

final class ApiController
{
    public function state(Request $r)
    {
        return response()->json(['state' => app(Snapshot::class)->get($r), 'csrfToken' => csrf_token()]);
    }

    public function action(Request $r, string $action)
    {
        $result = match ($action) {
            'customer-login' => app(IdentityService::class)->customerLogin($r),
            'customer-logout' => $this->logout($r, 'customer'),
            'customer-name' => app(GameService::class)->name($r),
            'staff-login' => app(IdentityService::class)->staffLogin($r),
            'staff-logout' => $this->logout($r, 'staff'),
            'staff-save' => app(IdentityService::class)->saveStaff($r),
            'staff-password' => app(IdentityService::class)->changePassword($r),
            'spin' => app(GameService::class)->spin($r),
            'activate' => app(GameService::class)->activate($r),
            'use-voucher' => app(GameService::class)->redeem($r, false),
            'redeem' => app(GameService::class)->redeem($r, true),
            'prizes' => app(CampaignService::class)->prizes($r),
            'settings' => app(CampaignService::class)->settings($r),
            'appearance' => app(CampaignService::class)->appearance($r),
            'content' => app(CampaignService::class)->content($r),
            'code' => app(CampaignService::class)->code($r),
            default => abort(404),
        };

        return response()->json(['result' => $result, 'state' => app(Snapshot::class)->get($r), 'csrfToken' => csrf_token()]);
    }

    private function logout(Request $r, string $kind): bool
    {
        $r->session()->forget($kind);
        $r->session()->regenerate();

        return true;
    }

    public function export(Request $r)
    {
        Access::require($r, 'reports.export');
        $state = app(Snapshot::class)->get($r);
        $users = array_column($state['users'], null, 'id');
        $query = mb_strtolower(trim((string) $r->query('q', '')));
        $status = $r->query('status', 'all');
        $rows = [['Tên', 'Số điện thoại', 'Phần thưởng', 'Mã theo dõi ANNI', 'Mã voucher nhận quà', 'Lời hướng dẫn', 'Ngày trúng', 'Hạn sử dụng', 'Trạng thái', 'Nguồn xác nhận', 'Người xác nhận', 'Ngày sử dụng']];
        foreach ($state['vouchers'] as $v) {
            $u = $users[$v['userId']] ?? [];
            $s = $v['redeemedAt'] ? 'used' : (strtotime($v['expiresAt']) <= time() ? 'expired' : 'active');
            if ($status !== 'all' && $s !== $status) {
                continue;
            }
            if ($query && ! str_contains(mb_strtolower(implode(' ', [$u['name'] ?? '', $u['phone'] ?? '', $v['code'], $v['externalCode'] ?? '', $v['prize']['name']])), $query)) {
                continue;
            }
            $rows[] = [$u['name'] ?? '', $u['phone'] ?? '', $v['prize']['name'], $v['code'], $v['externalCode'] ?? '', $v['externalMessage'] ?? '', $v['at'], $v['expiresAt'], ['used' => 'Đã sử dụng', 'active' => 'Còn hiệu lực', 'expired' => 'Đã hết hạn'][$s], $v['redeemedByType'], $v['redeemedBy'], $v['redeemedAt']];
        }
        $output = "\xEF\xBB\xBF";
        foreach ($rows as $row) {
            $output .= implode(',', array_map(fn ($v) => '"'.str_replace('"', '""', preg_replace('/^[=+@-]/', "'$0", (string) ($v ?? ''))).'"', $row))."\r\n";
        }

        return response($output, 200, ['Content-Type' => 'text/csv; charset=UTF-8', 'Content-Disposition' => 'attachment; filename="ANNI-COFFEE-danh-sach-trung.csv"']);
    }
}
