<?php

namespace App\Domain;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class Snapshot
{
    public function get(Request $r): array
    {
        return DB::transaction(function () use ($r) {
            $campaign = DB::table('campaigns')->where('id', 1)->sharedLock()->first();
            abort_unless($campaign, 503, 'Ứng dụng chưa được khởi tạo.');
            $actor = Access::staff($r);
            $customer = Access::customer($r, false);
            $settings = Store::decode($campaign->settings);
            if (! Access::can($actor, 'content.view')) {
                unset($settings['contentPrevious']);
            }
            // Public presentation is shared, but administrative keys/credentials and code pools never are.
            unset($settings['codeHint']);
            $allVouchers = Access::can($actor, 'vouchers.view') || Access::can($actor, 'reports.view');
            $vouchers = DB::table('vouchers')->when(! $allVouchers, fn ($q) => $q->where('customer_id', $customer?->id ?? ''))->orderBy('created_at')->get();
            $customerIds = $vouchers->pluck('customer_id')->all();
            if ($customer) {
                $customerIds[] = $customer->id;
            }
            $users = DB::table('customers')->whereIn('id', array_unique($customerIds))->get()->map(fn ($u) => Store::customer($u))->all();
            $state = ['version' => 1, 'revision' => (int) $campaign->revision, 'settings' => $settings, 'prizesRevision' => (int) $campaign->prizes_revision,
                'prizes' => Store::prizes(Access::can($actor, 'prizes.view')), 'users' => $users, 'vouchers' => $vouchers->map(fn ($v) => Store::voucher($v))->all(),
                'credits' => [], 'spins' => [], 'codes' => [], 'redemptions' => [], 'staff' => [], 'staffAudit' => [],
                'actor' => $actor, 'customer' => $customer ? Store::customer($customer) : null, 'balance' => $customer ? app(GameService::class)->balance($customer->id, $settings) : ['free' => $settings['dailyFree'], 'earned' => 0]];
            if (Access::can($actor, 'codes.view')) {
                $state['codes'] = DB::table('turn_codes')->get()->map(function ($c) {
                    $data = Store::decode($c->payload);
                    $data['uses'] = DB::table('credits')->where('turn_code_id', $c->id)->get()->map(fn ($u) => ['userId' => $u->customer_id, 'day' => $u->day, 'at' => Store::iso($u->created_at)])->all();

                    return $data;
                })->all();
            }
            if (Access::can($actor, 'staff.manage')) {
                $state['staff'] = DB::table('staff_accounts')->get()->map(fn ($s) => Access::staffData($s))->all();
                $state['staffAudit'] = DB::table('audit_logs')->orderByDesc('created_at')->limit(500)->get()->reverse()->map(fn ($a) => ['id' => $a->id, 'at' => Store::iso($a->created_at), 'actorId' => $a->actor_id, 'actorName' => $a->actor_name, 'action' => $a->action, 'targetId' => $a->target_id, 'targetName' => $a->target_name, 'detail' => $a->detail])->values()->all();
            }
            if (Access::can($actor, 'overview.view')) {
                $distribution = [];
                foreach (DB::table('spins')->select('prize')->get() as $s) {
                    $id = Store::decode($s->prize)['id'];
                    $distribution[$id] = ($distribution[$id] ?? 0) + 1;
                }
                $recent = DB::table('spins')->join('customers', 'customers.id', '=', 'spins.customer_id')->orderByDesc('spins.created_at')->limit(4)->get(['spins.prize', 'spins.created_at', 'customers.phone'])->map(fn ($s) => ['prize' => Store::decode($s->prize), 'at' => Store::iso($s->created_at), 'phone' => substr($s->phone, 0, 3).'••••'.substr($s->phone, -3)])->reverse()->values()->all();
                $state['metrics'] = ['spins' => DB::table('spins')->count(), 'users' => DB::table('customers')->count(), 'vouchers' => DB::table('vouchers')->count(), 'redemptions' => DB::table('redemptions')->count(), 'distribution' => $distribution, 'recent' => $recent];
            }

            return $state;
        });
    }
}
