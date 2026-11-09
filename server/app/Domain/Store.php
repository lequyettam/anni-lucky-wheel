<?php

namespace App\Domain;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class Store
{
    public static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    public static function decode(?string $value): array
    {
        return $value ? json_decode($value, true, 512, JSON_THROW_ON_ERROR) : [];
    }

    public static function id(): string
    {
        return (string) Str::uuid();
    }

    public static function iso($value): ?string
    {
        return $value ? CarbonImmutable::parse($value, 'UTC')->toISOString() : null;
    }

    public static function fail(string $message): never
    {
        throw ValidationException::withMessages(['game' => $message]);
    }

    public static function transaction(callable $fn): mixed
    {
        return DB::transaction(function () use ($fn) {
            $campaign = DB::table('campaigns')->where('id', 1)->lockForUpdate()->first();
            abort_unless($campaign, 503, 'Ứng dụng chưa được khởi tạo trên máy chủ.');
            $result = $fn($campaign);
            DB::table('campaigns')->where('id', 1)->increment('revision');

            return $result;
        }, 3);
    }

    public static function settings(): array
    {
        return self::decode(DB::table('campaigns')->where('id', 1)->value('settings'));
    }

    public static function prizes(bool $pools = false): array
    {
        $keys = $pools ? DB::table('voucher_keys')->where('kind', 'imported')->whereNull('voucher_id')->orderBy('id')->get()->groupBy('prize_id') : collect();

        return DB::table('prizes')->where('active', true)->orderBy('position')->get()->map(function ($p) use ($keys, $pools) {
            $data = self::decode($p->payload) + ['id' => $p->id];
            $data['stock'] = $p->stock === null ? null : (int) $p->stock;
            $data['weight'] = (int) $p->weight;
            if ($pools && ($data['codeMode'] ?? 'automatic') === 'imported') {
                $data['voucherCodes'] = $keys->get($p->id, collect())->pluck('original')->all();
            }
            if (! $pools) {
                unset($data['codeMode'],$data['codeMessage'],$data['voucherCodes']);
            }

            return $data;
        })->all();
    }

    public static function award(array $prize): array
    {
        unset($prize['voucherCodes'],$prize['codeMessage'],$prize['codeMode']);

        return $prize;
    }

    public static function voucher(object $v): array
    {
        return [
            'id' => $v->id, 'code' => $v->code, 'userId' => $v->customer_id, 'spinId' => $v->spin_id, 'prize' => self::decode($v->prize),
            'branch' => $v->branch, 'at' => self::iso($v->created_at), 'expiresAt' => self::iso($v->expires_at), 'redeemedAt' => self::iso($v->redeemed_at),
            'redeemedBy' => $v->redeemed_by, 'redeemedByType' => $v->redeemed_by_type, 'redeemedById' => $v->redeemed_by_id,
            'externalCode' => $v->external_code, 'externalMessage' => $v->external_message,
        ];
    }

    public static function customer(object $u): array
    {
        return ['id' => $u->id, 'phone' => $u->phone, 'name' => $u->name, 'createdAt' => self::iso($u->created_at)];
    }

    public static function audit(?array $actor, string $action, string $target = '', string $name = '', string $detail = ''): void
    {
        DB::table('audit_logs')->insert(['id' => self::id(), 'actor_id' => $actor['id'] ?? null, 'actor_name' => $actor['name'] ?? 'CLI',
            'action' => $action, 'target_id' => $target ?: null, 'target_name' => $name, 'detail' => $detail, 'created_at' => now()]);
    }
}
