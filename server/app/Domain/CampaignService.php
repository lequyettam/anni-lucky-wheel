<?php

namespace App\Domain;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class CampaignService
{
    public function prizes(Request $r): bool
    {
        $input = $r->validate(['prizes' => 'required|array', 'revision' => 'required|integer|min:0']);
        $prizes = Validation::prizes($input['prizes']);

        return Store::transaction(function ($campaign) use ($r, $input, $prizes) {
            $actor = Access::require($r, 'prizes.edit');
            abort_if((int) $campaign->prizes_revision !== (int) $input['revision'], 409, 'Phần thưởng hoặc tồn mã đã thay đổi. Hãy Hủy thay đổi để tải lại.');
            $codes = [];
            foreach ($prizes as $p) {
                foreach ($p['voucherCodes'] as $code) {
                    $codes[] = strtoupper($code);
                }
            }
            if ($codes && DB::table('voucher_keys')->whereIn('code_key', $codes)->whereNotNull('voucher_id')->exists()) {
                Store::fail('Có mã đã cấp cho khách. Không thể nhập lại.');
            }
            // Issued identifiers remain forever. Only unused codes are replaced by the reviewed draft.
            DB::table('voucher_keys')->where('kind', 'imported')->whereNull('voucher_id')->delete();
            DB::table('prizes')->update(['active' => false]);
            foreach ($prizes as $i => $p) {
                $pool = $p['voucherCodes'];
                unset($p['voucherCodes']);
                DB::table('prizes')->updateOrInsert(['id' => $p['id']], ['position' => $i, 'active' => true, 'kind' => $p['kind'], 'weight' => $p['weight'], 'stock' => $p['stock'], 'payload' => Store::json($p)]);
                foreach ($pool as $code) {
                    DB::table('voucher_keys')->insert(['code_key' => strtoupper($code), 'original' => $code, 'kind' => 'imported', 'prize_id' => $p['id'], 'voucher_id' => null]);
                }
            }
            DB::table('campaigns')->where('id', 1)->increment('prizes_revision');
            Store::audit($actor, 'prizes', 'campaign', 'Phần thưởng', 'Cập nhật danh mục và kho mã chưa cấp.');

            return true;
        });
    }

    public function settings(Request $r): bool
    {
        $data = $r->validate(['title' => 'required|string|max:80', 'branch' => 'required|string|max:120', 'dailyFree' => 'required|integer|min:0|max:100', 'active' => 'required|boolean',
            'mode' => 'required|in:weighted,uniform', 'start' => 'nullable|date', 'end' => 'nullable|date', 'codeHint' => 'nullable|string|max:80']);
        if (! empty($data['start']) && ! empty($data['end']) && strtotime($data['end']) <= strtotime($data['start'])) {
            Store::fail('Thời gian kết thúc phải sau bắt đầu.');
        }
        $data['dailyFree'] = (int) $data['dailyFree'];
        $data['start'] = $data['start'] ?? '';
        $data['end'] = $data['end'] ?? '';

        return Store::transaction(function ($c) use ($r, $data) {
            $actor = Access::require($r, 'settings.edit');
            $settings = array_replace(Store::decode($c->settings), $data);
            DB::table('campaigns')->where('id', 1)->update(['settings' => Store::json($settings)]);
            Store::audit($actor, 'settings', 'campaign', 'Thiết lập');

            return true;
        });
    }

    public function appearance(Request $r): bool
    {
        $data = $r->validate(['theme' => 'required|string', 'decorations' => 'required|boolean']);
        if (! in_array($data['theme'], Validation::themeIds(), true)) {
            Store::fail('Chủ đề không hợp lệ.');
        }

        return Store::transaction(function ($c) use ($r, $data) {
            $actor = Access::require($r, 'themes.edit');
            $settings = Store::decode($c->settings);
            $settings['appearance'] = $data;
            DB::table('campaigns')->where('id', 1)->update(['settings' => Store::json($settings)]);
            Store::audit($actor, 'theme', 'campaign', $data['theme']);

            return true;
        });
    }

    public function content(Request $r): int
    {
        $data = $r->validate(['content' => 'required|array', 'revision' => 'required|integer|min:0']);
        $content = Validation::content($data['content']);

        return Store::transaction(function ($c) use ($r, $data, $content) {
            $actor = Access::require($r, 'content.edit');
            $settings = Store::decode($c->settings);
            abort_if(($settings['contentRevision'] ?? 0) !== (int) $data['revision'], 409, 'Nội dung đã thay đổi. Hãy tải bản đang dùng.');
            $settings['contentPrevious'] = ['content' => $settings['content'], 'savedAt' => $settings['contentUpdatedAt'] ?? null];
            $settings['content'] = $content;
            $settings['contentRevision']++;
            $settings['contentUpdatedAt'] = now()->toISOString();
            DB::table('campaigns')->where('id', 1)->update(['settings' => Store::json($settings)]);
            Store::audit($actor, 'content', 'campaign', 'Nội dung & thương hiệu');

            return $settings['contentRevision'];
        });
    }

    public function code(Request $r): array
    {
        $data = $r->validate(['id' => 'nullable|string|max:64|regex:/^[A-Za-z0-9_-]+$/', 'code' => 'required|string|regex:/^[A-Za-z0-9-]{4,24}$/',
            'turns' => 'required|integer|min:1|max:100', 'maxUses' => 'required|integer|min:1|max:100000', 'perPhone' => 'required|integer|min:1|max:100', 'creditDays' => 'required|integer|min:1|max:365',
            'period' => 'required|in:all,day', 'active' => 'required|boolean', 'starts' => 'required|date', 'ends' => 'required|date|after:starts', 'branch' => 'required|string|max:120']);
        $data['code'] = strtoupper(trim($data['code']));
        foreach (['turns', 'maxUses', 'perPhone', 'creditDays'] as $key) {
            $data[$key] = (int) $data[$key];
        }

        return Store::transaction(function () use ($r, $data) {
            $actor = Access::require($r, 'codes.edit');
            $id = ($data['id'] ?? null) ?: Store::id();
            $data['id'] = $id;
            $old = DB::table('turn_codes')->where('id', $id)->first();
            if (DB::table('turn_codes')->where('code', $data['code'])->where('id', '!=', $id)->exists()) {
                Store::fail('Mã cấp lượt đã tồn tại.');
            }
            if ($old && $old->code !== $data['code'] && DB::table('credits')->where('turn_code_id', $id)->exists()) {
                Store::fail('Mã đã sử dụng không thể đổi tên.');
            }
            DB::table('turn_codes')->updateOrInsert(['id' => $id], ['code' => $data['code'], 'payload' => Store::json($data)]);
            Store::audit($actor, 'code', $id, 'Mã cấp lượt');

            return $data;
        });
    }
}
