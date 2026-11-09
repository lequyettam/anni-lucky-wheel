<?php

namespace Tests\Feature;

use App\Domain\Store;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class GameApiTest extends TestCase
{
    public function test_public_state_does_not_disclose_pools_people_or_credentials(): void
    {
        $this->customer();
        $this->staff();
        $this->flushSession();
        $r = $this->getJson('/api/state')->assertOk();
        $r->assertJsonPath('state.users', [])->assertJsonPath('state.staff', [])->assertJsonPath('state.vouchers', [])->assertJsonPath('state.actor', null)->assertJsonMissingPath('state.prizes.1.voucherCodes');
        $this->assertStringNotContainsString('AU79j090', $r->getContent());
        $this->assertStringNotContainsString('recovery_hash', $r->getContent());
        $r->assertHeader('Cache-Control', 'no-store, private');
    }

    public function test_spin_allocates_code_and_retry_returns_same_result(): void
    {
        $this->customer();
        $first = $this->spin()->assertOk();
        $v = $first->json('result.voucher');
        $this->assertSame('AU79j090', $v['externalCode']);
        $this->assertSame('Dùng AU79j090 tại quầy', $v['externalMessage']);
        $this->spin()->assertOk()->assertJsonPath('result.voucher.id', $v['id']);
        $this->assertDatabaseCount('spins', 1);
        $this->assertDatabaseCount('vouchers', 1);
        $this->assertSame(1, (int) DB::table('prizes')->where('id', 'coffee')->value('stock'));
        $this->assertArrayNotHasKey('voucherCodes', $v['prize']);
        $this->assertArrayNotHasKey('voucherCodes', $first->json('result.spin.prize'));
    }

    public function test_reusing_request_for_another_source_is_rejected(): void
    {
        $this->customer();
        $this->spin()->assertOk();
        $this->postJson('/api/spin', ['source' => 'earned', 'requestId' => 'request-test-00000001'])->assertStatus(409);
        $this->assertDatabaseCount('spins', 1);
    }

    public function test_out_of_stock_does_not_consume_an_extra_turn(): void
    {
        $this->customer();
        $this->spin()->assertOk();
        $this->spin('request-test-00000002')->assertOk();
        $this->spin('request-test-00000003')->assertStatus(422);
        $this->assertDatabaseCount('spins', 2);
    }

    public function test_stock_redistributes_to_original_weight_above_one_percent(): void
    {
        $this->customer();
        $this->staff();
        $p = Store::prizes(true);
        $p[0]['weight'] = 200;
        $p[1]['weight'] = 9800;
        $p[1]['stock'] = 0;
        $p[1]['voucherCodes'] = [];
        $this->postJson('/api/prizes', ['prizes' => $p, 'revision' => 0])->assertOk();
        $this->spin()->assertOk()->assertJsonPath('result.voucher', null)->assertJsonPath('result.spin.prize.id', 'luck');
    }

    public function test_customer_cannot_read_or_redeem_another_wallet(): void
    {
        $first = $this->customer();
        $v = $this->spin()->assertOk()->json('result.voucher');
        $this->customer('0900000002');
        $this->getJson('/api/state')->assertOk()->assertJsonPath('state.vouchers', []);
        $this->postJson('/api/use-voucher', ['code' => $v['externalCode'], 'userId' => $first])->assertNotFound();
    }

    public function test_external_and_internal_identifiers_share_one_redemption(): void
    {
        $this->customer();
        $v = $this->spin()->assertOk()->json('result.voucher');
        $this->postJson('/api/use-voucher', ['code' => strtolower($v['externalCode'])])->assertOk();
        $this->staff('cashier');
        $this->postJson('/api/redeem', ['code' => $v['code']])->assertStatus(409);
        $this->assertDatabaseCount('redemptions', 1);
    }

    public function test_expired_voucher_cannot_be_redeemed(): void
    {
        $this->customer();
        $v = $this->spin()->assertOk()->json('result.voucher');
        DB::table('vouchers')->where('id', $v['id'])->update(['expires_at' => now()->subSecond()]);
        $this->postJson('/api/use-voucher', ['code' => $v['code']])->assertStatus(422);
        $this->assertDatabaseCount('redemptions', 0);
    }

    public function test_viewer_cannot_mutate_or_export_or_read_settings_secrets(): void
    {
        $this->customer();
        $v = $this->spin()->assertOk()->json('result.voucher');
        $this->staff('viewer');
        $this->postJson('/api/redeem', ['code' => $v['code']])->assertForbidden();
        $this->getJson('/api/reports/export')->assertForbidden();
        $this->postJson('/api/prizes', ['prizes' => $this->prizes(), 'revision' => 1])->assertForbidden();
        $this->getJson('/api/state')->assertOk()->assertJsonPath('state.codes', [])->assertJsonPath('state.staff', [])->assertJsonMissingPath('state.prizes.1.voucherCodes');
    }

    public function test_stale_draft_and_reimporting_issued_code_are_rejected(): void
    {
        $this->customer();
        $this->staff();
        $this->spin()->assertOk();
        $this->postJson('/api/prizes', ['prizes' => $this->prizes(), 'revision' => 0])->assertStatus(409);
        $this->postJson('/api/prizes', ['prizes' => $this->prizes(), 'revision' => 1])->assertStatus(422);
        $this->assertSame(1, (int) DB::table('prizes')->where('id', 'coffee')->value('stock'));
    }

    public function test_duplicate_codes_and_invalid_total_reject_atomically(): void
    {
        $this->staff();
        $p = $this->prizes();
        $p[1]['voucherCodes'] = ['AU79j090', 'au79J090'];
        $this->postJson('/api/prizes', ['prizes' => $p, 'revision' => 0])->assertStatus(422);
        $p = $this->prizes();
        $p[1]['weight'] = 9999;
        $this->postJson('/api/prizes', ['prizes' => $p, 'revision' => 0])->assertStatus(422);
        $this->assertDatabaseCount('voucher_keys', 2);
    }

    public function test_editing_instructions_does_not_rewrite_awarded_voucher(): void
    {
        $this->customer();
        $this->staff();
        $this->spin()->assertOk();
        $p = Store::prizes(true);
        $p[1]['codeMessage'] = 'Đã đổi {code}';
        $p[1]['voucherCodes'][] = 'NEW001';
        $p[1]['stock'] = 2;
        $this->postJson('/api/prizes', ['prizes' => $p, 'revision' => 1])->assertOk();
        $this->assertSame('Dùng AU79j090 tại quầy', DB::table('vouchers')->first()->external_message);
    }

    public function test_customer_recovery_works_in_a_new_session(): void
    {
        $r = $this->postJson('/api/customer-login', ['phone' => '0900000001', 'recovery' => ''])->assertOk();
        $id = $r->json('result.user.id');
        $key = $r->json('result.recoveryCode');
        $this->assertNotEmpty($key);
        $this->assertTrue(Hash::check($key, DB::table('customers')->where('id', $id)->value('recovery_hash')));
        $this->flushSession();
        $this->postJson('/api/customer-login', ['phone' => '0900000001', 'recovery' => 'WRONG'])->assertStatus(422);
        $this->postJson('/api/customer-login', ['phone' => '+84 900 000 001', 'recovery' => strtolower($key)])->assertOk()->assertJsonPath('result.user.id', $id)->assertJsonPath('result.recoveryCode', null);
    }

    public function test_registration_retry_recovers_lost_response_without_exposing_key_to_others(): void
    {
        $key = str_repeat('a', 64);
        $first = $this->postJson('/api/customer-login', ['phone' => '0900000001', 'enrollmentKey' => $key])->assertOk();
        $this->flushSession();
        $retry = $this->postJson('/api/customer-login', ['phone' => '0900000001', 'enrollmentKey' => $key])->assertOk();
        $this->assertSame($first->json('result.recoveryCode'), $retry->json('result.recoveryCode'));
        $this->assertDatabaseCount('customers', 1);
        $this->flushSession();
        $this->postJson('/api/customer-login', ['phone' => '0900000001', 'enrollmentKey' => str_repeat('b', 64)])->assertStatus(422);
        $this->getJson('/api/state')->assertJsonMissingPath('state.enrollment_recovery');
        DB::table('customers')->update(['enrollment_expires_at' => now()->subSecond()]);
        $this->postJson('/api/customer-login', ['phone' => '0900000001', 'enrollmentKey' => $key])->assertStatus(422);
    }

    public function test_staff_login_password_hash_and_logout(): void
    {
        $id = $this->staff();
        $account = DB::table('staff_accounts')->where('id', $id)->first();
        $this->flushSession();
        $this->postJson('/api/staff-login', ['username' => $account->username, 'password' => 'wrong'])->assertStatus(422);
        $r = $this->postJson('/api/staff-login', ['username' => $account->username, 'password' => 'Testing-only-password!'])->assertOk()->assertJsonPath('state.actor.id', $id);
        $this->assertStringNotContainsString($account->password, $r->getContent());
        $this->assertStringStartsWith('$argon2id$', DB::table('staff_accounts')->where('id', $id)->value('password'));
        $this->postJson('/api/staff-logout')->assertOk()->assertJsonPath('state.actor', null);
    }

    public function test_vietnam_daily_limit_is_checked_on_the_server(): void
    {
        $this->customer();
        $cfg = Store::settings();
        $cfg['dailyFree'] = 1;
        DB::table('campaigns')->update(['settings' => Store::json($cfg)]);
        $this->travelTo(Carbon::parse('2026-11-09T16:59:00Z'));
        $this->spin()->assertOk();
        $this->spin('request-test-00000002')->assertStatus(422);
        $this->travelTo(Carbon::parse('2026-11-09T17:00:00Z'));
        $this->spin('request-test-00000003')->assertOk();
        $this->travelBack();
    }

    public function test_customer_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/customer-login', ['phone' => '0900000001', 'recovery' => 'WRONG'])->assertStatus(422);
        }$this->postJson('/api/customer-login', ['phone' => '0900000001', 'recovery' => 'WRONG'])->assertStatus(429);
    }

    public function test_turn_code_quota_and_retry_are_enforced(): void
    {
        $this->staff();
        $this->customer();
        $this->postJson('/api/code', ['id' => '', 'code' => 'QUAY2026', 'turns' => 2, 'maxUses' => 1, 'perPhone' => 1, 'creditDays' => 7, 'period' => 'all', 'active' => true, 'starts' => now()->subDay()->toISOString(), 'ends' => now()->addDay()->toISOString(), 'branch' => 'ANNI'])->assertOk();
        $r = $this->postJson('/api/activate', ['code' => 'quay2026', 'requestId' => 'activate-test-00000001'])->assertOk();
        $this->postJson('/api/activate', ['code' => 'QUAY2026', 'requestId' => 'activate-test-00000001'])->assertOk()->assertJsonPath('result.id', $r->json('result.id'));
        $this->postJson('/api/activate', ['code' => 'QUAY2026', 'requestId' => 'activate-test-00000002'])->assertStatus(422);
        $this->assertDatabaseCount('credits', 1);
    }

    public function test_staff_revocation_is_checked_at_every_write(): void
    {
        $id = $this->staff();
        DB::table('staff_accounts')->where('id', $id)->increment('version');
        $this->postJson('/api/prizes', ['prizes' => $this->prizes(), 'revision' => 0])->assertUnauthorized();
        $this->getJson('/api/state')->assertOk()->assertJsonPath('state.actor', null);
    }

    public function test_last_admin_cannot_be_disabled(): void
    {
        $id = $this->staff();
        $staff = DB::table('staff_accounts')->where('id', $id)->first();
        $this->postJson('/api/staff-save', ['id' => $id, 'name' => $staff->name, 'username' => $staff->username, 'role' => 'admin', 'permissions' => [], 'active' => false, 'revision' => 1, 'password' => ''])->assertStatus(422);
    }

    public function test_server_rejects_fake_image_and_preserves_content_revision(): void
    {
        $this->staff();
        $content = Store::settings()['content'];
        $content['brand']['logo'] = 'data:image/png;base64,aGVsbG8=';
        $this->postJson('/api/content', ['content' => $content, 'revision' => 0])->assertStatus(422);
        $this->assertSame(0, Store::settings()['contentRevision']);
    }

    public function test_content_theme_and_settings_are_shared_and_revision_protected(): void
    {
        $this->staff();
        $content = Store::settings()['content'];
        $content['brand']['name'] = 'ANNI mới';
        $this->postJson('/api/content', ['content' => $content, 'revision' => 0])->assertOk();
        $this->postJson('/api/content', ['content' => $content, 'revision' => 0])->assertStatus(409);
        $this->postJson('/api/appearance', ['theme' => 'halloween', 'decorations' => true])->assertOk();
        $this->flushSession();
        $this->getJson('/api/state')->assertOk()->assertJsonPath('state.settings.content.brand.name', 'ANNI mới')->assertJsonPath('state.settings.appearance.theme', 'halloween');
    }

    public function test_production_mutations_require_csrf(): void
    {
        $this->app->detectEnvironment(fn () => 'production');
        $this->postJson('/api/customer-login', ['phone' => '0900000001'])->assertStatus(419);
        $this->assertDatabaseCount('customers', 0);
    }

    public function test_no_public_bootstrap_or_snapshot_write_endpoint(): void
    {
        $this->postJson('/api/staff-setup', [])->assertNotFound();
        $this->postJson('/api/state', ['staff' => [['role' => 'admin']]])->assertStatus(405);
        $this->spin()->assertUnauthorized();
    }

    public function test_settings_accept_empty_schedule_without_overwriting_presentation(): void
    {
        $this->staff();
        $settings = Store::settings();
        $this->postJson('/api/settings', ['title' => 'Chương trình mới', 'branch' => 'ANNI', 'dailyFree' => 2, 'active' => false, 'mode' => 'weighted', 'start' => '', 'end' => '', 'appearance' => ['theme' => 'invalid']])->assertOk();
        $this->assertSame($settings['appearance'], Store::settings()['appearance']);
        $this->assertSame('', Store::settings()['start']);
    }

    public function test_new_turn_code_can_omit_id(): void
    {
        $this->staff();
        $this->postJson('/api/code', ['code' => 'NEW-CODE', 'turns' => 1, 'maxUses' => 5, 'perPhone' => 1, 'creditDays' => 1, 'period' => 'all', 'active' => true, 'starts' => now()->subDay()->toISOString(), 'ends' => now()->addDay()->toISOString(), 'branch' => 'ANNI'])->assertOk();
        $this->assertDatabaseCount('turn_codes', 1);
    }

    public function test_csv_export_honors_filter_and_escapes_formula(): void
    {
        $id = $this->customer();
        DB::table('customers')->where('id', $id)->update(['name' => '=SUM(1,2)']);
        $this->spin()->assertOk();
        $this->staff();
        $r = $this->get('/api/reports/export?q=AU79j090&status=active')->assertOk();
        $this->assertStringContainsString("'=SUM(1,2)", $r->getContent());
        $this->assertStringContainsString('AU79j090', $r->getContent());
        $empty = $this->get('/api/reports/export?status=used')->assertOk();
        $this->assertStringNotContainsString('AU79j090', $empty->getContent());
    }

    public function test_cli_installer_creates_paused_campaign_and_hashed_admin_only(): void
    {
        DB::table('voucher_keys')->delete();
        DB::table('prizes')->delete();
        DB::table('campaigns')->delete();
        $this->artisan('anni:install')
            ->expectsQuestion('Tên quản trị viên', 'Quản trị kiểm tra')
            ->expectsQuestion('Tên đăng nhập', 'install_admin')
            ->expectsQuestion('Mật khẩu riêng cho hệ thống này (ít nhất 12 ký tự)', 'Install-testing-only!')
            ->expectsQuestion('Nhập lại mật khẩu', 'Install-testing-only!')
            ->assertSuccessful();
        $this->assertFalse(Store::settings()['active']);
        $this->assertSame(0, (int) DB::table('prizes')->sum('stock'));
        $this->assertDatabaseCount('customers', 0);
        $this->assertDatabaseCount('turn_codes', 0);
        $this->assertDatabaseCount('voucher_keys', 0);
        $this->assertDatabaseCount('staff_accounts', 1);
        $this->assertTrue(Hash::check('Install-testing-only!', DB::table('staff_accounts')->value('password')));
    }

    public function test_cli_installer_refuses_to_overwrite_existing_campaign(): void
    {
        $before = Store::settings();
        $this->artisan('anni:install')->assertFailed();
        $this->assertSame($before, Store::settings());
        $this->assertDatabaseCount('campaigns', 1);
    }
}
