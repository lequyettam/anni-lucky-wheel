<?php

namespace App\Domain;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;

final class GameService
{
    public function balance(string $id, ?array $settings = null): array
    {
        $settings ??= Store::settings();
        $day = now('Asia/Ho_Chi_Minh')->format('Y-m-d');

        return ['free' => max(0, $settings['dailyFree'] - DB::table('spins')->where('customer_id', $id)->where('source', 'free')->where('day', $day)->count()),
            'earned' => (int) DB::table('credits')->where('customer_id', $id)->where('expires_at', '>', now())->sum('remaining')];
    }

    public function spinData(object $s): array
    {
        return ['id' => $s->id, 'requestId' => $s->request_id, 'userId' => $s->customer_id, 'source' => $s->source, 'day' => $s->day, 'at' => Store::iso($s->created_at), 'prize' => Store::decode($s->prize)];
    }

    private function result(object $spin): array
    {
        $v = DB::table('vouchers')->where('spin_id', $spin->id)->first();

        return ['spin' => $this->spinData($spin), 'voucher' => $v ? Store::voucher($v) : null, 'recoveryCode' => null];
    }

    public function spin(Request $r): array
    {
        $data = $r->validate(['source' => 'required|in:free,earned', 'requestId' => 'required|string|min:16|max:80|regex:/^[A-Za-z0-9_-]+$/']);

        return Store::transaction(function ($campaign) use ($r, $data) {
            $u = Access::customer($r);
            $previous = DB::table('spins')->where('customer_id', $u->id)->where('request_id', $data['requestId'])->first();
            if ($previous) {
                abort_if($previous->source !== $data['source'], 409, 'Mã yêu cầu đã dùng cho thao tác khác.');

                return $this->result($previous);
            }
            $cfg = Store::decode($campaign->settings);
            if (! $cfg['active'] || (! empty($cfg['start']) && CarbonImmutable::parse($cfg['start'])->isFuture()) || (! empty($cfg['end']) && CarbonImmutable::parse($cfg['end'])->isPast())) {
                Store::fail('Chiến dịch hiện chưa mở. Hẹn bạn quay lại sau!');
            }
            if ($this->balance($u->id, $cfg)[$data['source']] <= 0) {
                Store::fail('Bạn đã hết lượt ở nguồn đã chọn.');
            }
            $prize = Probability::pick(Store::prizes(true), $cfg['mode']);
            $snapshot = Store::award($prize);
            if ($data['source'] === 'earned') {
                $credit = DB::table('credits')->where('customer_id', $u->id)->where('remaining', '>', 0)->where('expires_at', '>', now())->orderBy('expires_at')->orderBy('id')->first();
                abort_unless($credit, 409, 'Lượt quay đã thay đổi.');
                DB::table('credits')->where('id', $credit->id)->decrement('remaining');
            }
            $spinId = Store::id();
            $time = now();
            DB::table('spins')->insert(['id' => $spinId, 'customer_id' => $u->id, 'request_id' => $data['requestId'], 'source' => $data['source'], 'day' => now('Asia/Ho_Chi_Minh')->format('Y-m-d'), 'prize' => Store::json($snapshot), 'created_at' => $time]);
            if ($prize['kind'] !== 'lose') {
                $key = null;
                if (($prize['codeMode'] ?? 'automatic') === 'imported') {
                    $key = DB::table('voucher_keys')->where('prize_id', $prize['id'])->where('kind', 'imported')->whereNull('voucher_id')->orderBy('id')->lockForUpdate()->first();
                    if (! $key) {
                        Store::fail('Phần thưởng đã hết mã. Vui lòng thử lại.');
                    }
                }
                $updated = DB::table('prizes')->where('id', $prize['id'])->where('stock', '>', 0)->decrement('stock');
                abort_unless($updated, 409, 'Phần thưởng vừa hết.');
                DB::table('campaigns')->where('id', 1)->increment('prizes_revision');
                do {
                    $code = 'AC-'.strtoupper(bin2hex(random_bytes(10)));
                } while (DB::table('voucher_keys')->where('code_key', $code)->exists());
                $voucherId = Store::id();
                $message = $key ? preg_replace_callback('/#mã|\{code\}/iu', fn () => $key->original, $prize['codeMessage'] ?? '') : null;
                DB::table('vouchers')->insert(['id' => $voucherId, 'customer_id' => $u->id, 'spin_id' => $spinId, 'code' => $code, 'external_code' => $key?->original, 'external_message' => $message,
                    'prize' => Store::json($snapshot), 'branch' => $cfg['branch'], 'created_at' => $time, 'expires_at' => $time->copy()->addDays($prize['days'])]);
                DB::table('voucher_keys')->insert(['code_key' => $code, 'original' => $code, 'kind' => 'internal', 'prize_id' => $prize['id'], 'voucher_id' => $voucherId]);
                if ($key) {
                    DB::table('voucher_keys')->where('id', $key->id)->whereNull('voucher_id')->update(['voucher_id' => $voucherId]);
                }
            }

            return $this->result(DB::table('spins')->where('id', $spinId)->first());
        });
    }

    public function activate(Request $r): array
    {
        $data = $r->validate(['code' => 'required|string|max:24', 'requestId' => 'required|string|min:16|max:80|regex:/^[A-Za-z0-9_-]+$/']);
        $code = strtoupper(trim($data['code']));
        $user = Access::customer($r);
        $limit = 'activate:'.$user->id;
        abort_if(RateLimiter::tooManyAttempts($limit, 20), 429, 'Nhập mã quá nhiều lần. Vui lòng thử lại sau.');
        RateLimiter::hit($limit, 60);

        return Store::transaction(function () use ($r, $data, $code) {
            $u = Access::customer($r);
            $existing = DB::table('credits')->where('customer_id', $u->id)->where('request_id', $data['requestId'])->first();
            if ($existing) {
                abort_if(DB::table('turn_codes')->where('id', $existing->turn_code_id)->value('code') !== $code, 409, 'Mã yêu cầu đã dùng cho mã khác.');

                return $this->creditData($existing);
            }
            $row = DB::table('turn_codes')->where('code', $code)->first();
            $c = $row ? Store::decode($row->payload) : null;
            if (! $c || ! $c['active'] || CarbonImmutable::parse($c['starts'])->isFuture() || ! CarbonImmutable::parse($c['ends'])->isFuture()) {
                Store::fail('Mã không tồn tại, đã khóa hoặc chưa/đã hết hiệu lực.');
            }
            if (DB::table('credits')->where('turn_code_id', $row->id)->count() >= $c['maxUses']) {
                Store::fail('Mã đã đạt giới hạn kích hoạt.');
            }
            $day = now('Asia/Ho_Chi_Minh')->format('Y-m-d');
            $used = DB::table('credits')->where('turn_code_id', $row->id)->where('customer_id', $u->id)->when($c['period'] === 'day', fn ($q) => $q->where('day', $day))->count();
            if ($used >= $c['perPhone']) {
                Store::fail('Bạn đã dùng hết số lần được phép của mã.');
            }
            $id = Store::id();
            DB::table('credits')->insert(['id' => $id, 'customer_id' => $u->id, 'turn_code_id' => $row->id, 'request_id' => $data['requestId'], 'day' => $day, 'remaining' => $c['turns'], 'expires_at' => now()->addDays($c['creditDays']), 'created_at' => now()]);

            return $this->creditData(DB::table('credits')->where('id', $id)->first());
        });
    }

    public function creditData(object $c): array
    {
        return ['id' => $c->id, 'userId' => $c->customer_id, 'remaining' => (int) $c->remaining, 'expiresAt' => Store::iso($c->expires_at)];
    }

    public function redeem(Request $r, bool $staff): array
    {
        $data = $r->validate(['code' => 'required|string|max:64']);
        $key = strtoupper(trim($data['code']));

        return Store::transaction(function () use ($r, $staff, $key) {
            if ($staff) {
                $actor = Access::require($r, 'vouchers.redeem');
                $type = 'staff';
            } else {
                $u = Access::customer($r);
                $actor = ['id' => $u->id, 'name' => $u->name ?: $u->phone];
                $type = 'customer';
            }
            $id = DB::table('voucher_keys')->where('code_key', $key)->value('voucher_id');
            $v = $id ? DB::table('vouchers')->where('id', $id)->lockForUpdate()->first() : null;
            abort_unless($v && ($staff || $v->customer_id === $actor['id']), 404, 'Không tìm thấy voucher.');
            abort_if($v->redeemed_at, 409, 'Voucher đã được sử dụng và không thể dùng lại.');
            if (! CarbonImmutable::parse($v->expires_at, 'UTC')->isFuture()) {
                Store::fail('Voucher đã hết hạn.');
            }
            $time = now();
            DB::table('vouchers')->where('id', $id)->whereNull('redeemed_at')->update(['redeemed_at' => $time, 'redeemed_by' => $actor['name'], 'redeemed_by_type' => $type, 'redeemed_by_id' => $actor['id']]);
            DB::table('redemptions')->insert(['id' => Store::id(), 'voucher_id' => $id, 'actor_id' => $actor['id'], 'actor_type' => $type, 'actor_name' => $actor['name'], 'created_at' => $time]);
            Store::audit($actor, 'redeem', $id, Store::decode($v->prize)['name'], $type === 'staff' ? 'Nhân viên xác nhận' : 'Khách hàng tự xác nhận');

            return Store::voucher(DB::table('vouchers')->where('id', $id)->first());
        });
    }

    public function name(Request $r): bool
    {
        $data = $r->validate(['name' => 'required|string|min:2|max:80']);

        return Store::transaction(function () use ($r,$data) {
            $u = Access::customer($r);
            DB::table('customers')->where('id',$u->id)->update(['name' => trim($data['name'])]);

            return true;
        });
    }
}
