<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

final class Prune extends Command
{
    protected $signature = 'anni:prune';

    protected $description = 'Remove expired sessions/cache; retain vouchers, code allocations and audit history';

    public function handle(): int
    {
        DB::table('sessions')->where('last_activity', '<', time() - config('session.lifetime') * 60)->delete();
        DB::table('cache')->where('expiration', '<', time())->delete();
        DB::table('cache_locks')->where('expiration', '<', time())->delete();
        DB::table('customers')->where('enrollment_expires_at', '<', now())->update(['enrollment_key_hash' => null, 'enrollment_recovery' => null, 'enrollment_expires_at' => null]);
        $this->info('Đã dọn phiên/cache hết hạn.');

        return 0;
    }
}
