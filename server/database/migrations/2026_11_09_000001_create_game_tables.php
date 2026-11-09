<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('campaigns', function (Blueprint $t) {
            $t->id();
            $t->json('settings');
            $t->unsignedBigInteger('prizes_revision')->default(0);
            $t->unsignedBigInteger('revision')->default(0);
        });
        Schema::create('prizes', function (Blueprint $t) {
            $t->string('id', 64)->primary();
            $t->unsignedInteger('position');
            $t->boolean('active')->default(true);
            $t->string('kind', 12);
            $t->unsignedInteger('weight');
            $t->unsignedInteger('stock')->nullable();
            $t->json('payload');
        });
        Schema::create('customers', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('phone', 10)->unique();
            $t->string('name', 80)->default('');
            $t->string('recovery_hash');
            $t->string('enrollment_key_hash', 64)->nullable();
            $t->text('enrollment_recovery')->nullable();
            $t->timestamp('enrollment_expires_at', 6)->nullable();
            $t->timestamp('created_at', 6);
        });
        Schema::create('staff_accounts', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('username', 32)->unique();
            $t->string('name', 80);
            $t->string('password');
            $t->string('role', 12);
            $t->json('permissions');
            $t->boolean('active')->default(true);
            $t->unsignedInteger('version')->default(1);
            $t->timestamp('created_at', 6);
            $t->timestamp('last_login_at', 6)->nullable();
        });
        Schema::create('turn_codes', function (Blueprint $t) {
            $t->string('id', 64)->primary();
            $t->string('code', 24)->unique();
            $t->json('payload');
        });
        Schema::create('credits', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('customer_id')->constrained('customers');
            $t->string('turn_code_id', 64);
            $t->foreign('turn_code_id')->references('id')->on('turn_codes');
            $t->string('request_id', 80);
            $t->char('day', 10);
            $t->unsignedInteger('remaining');
            $t->timestamp('expires_at', 6);
            $t->timestamp('created_at', 6);
            $t->unique(['customer_id', 'request_id']);
            $t->index(['turn_code_id', 'customer_id', 'day']);
        });
        Schema::create('spins', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('customer_id')->constrained('customers');
            $t->string('request_id', 80);
            $t->string('source', 8);
            $t->char('day', 10);
            $t->json('prize');
            $t->timestamp('created_at', 6);
            $t->unique(['customer_id', 'request_id']);
            $t->index(['customer_id', 'source', 'day']);
        });
        Schema::create('vouchers', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('customer_id')->constrained('customers');
            $t->foreignUuid('spin_id')->unique()->constrained('spins');
            $t->string('code', 64)->unique();
            $t->string('external_code', 64)->nullable()->unique();
            $t->text('external_message')->nullable();
            $t->json('prize');
            $t->string('branch', 120);
            $t->timestamp('created_at', 6);
            $t->timestamp('expires_at', 6);
            $t->timestamp('redeemed_at', 6)->nullable();
            $t->string('redeemed_by', 80)->nullable();
            $t->string('redeemed_by_type', 12)->nullable();
            $t->uuid('redeemed_by_id')->nullable();
            $t->index(['customer_id', 'expires_at']);
        });
        // A shared namespace prevents collisions between imported and generated identifiers.
        Schema::create('voucher_keys', function (Blueprint $t) {
            $t->id();
            $t->string('code_key', 64)->unique();
            $t->string('original', 64);
            $t->string('kind', 12);
            $t->string('prize_id', 64)->nullable();
            $t->foreign('prize_id')->references('id')->on('prizes');
            $t->foreignUuid('voucher_id')->nullable()->constrained('vouchers');
            $t->index(['prize_id', 'voucher_id']);
        });
        Schema::create('redemptions', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignUuid('voucher_id')->unique()->constrained('vouchers');
            $t->uuid('actor_id');
            $t->string('actor_type', 12);
            $t->string('actor_name', 80);
            $t->timestamp('created_at', 6);
        });
        Schema::create('audit_logs', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->uuid('actor_id')->nullable();
            $t->string('actor_name', 80);
            $t->string('action', 50);
            $t->string('target_id', 64)->nullable();
            $t->string('target_name', 120)->default('');
            $t->string('detail', 500)->default('');
            $t->timestamp('created_at', 6)->index();
        });
        Schema::create('sessions', function (Blueprint $t) {
            $t->string('id')->primary();
            $t->unsignedBigInteger('user_id')->nullable()->index();
            $t->string('ip_address', 45)->nullable();
            $t->text('user_agent')->nullable();
            $t->longText('payload');
            $t->integer('last_activity')->index();
        });
        Schema::create('cache', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->mediumText('value');
            $t->integer('expiration')->index();
        });
        Schema::create('cache_locks', function (Blueprint $t) {
            $t->string('key')->primary();
            $t->string('owner');
            $t->integer('expiration');
        });
    }

    public function down(): void
    {
        foreach (['cache_locks', 'cache', 'sessions', 'audit_logs', 'redemptions', 'voucher_keys', 'vouchers', 'spins', 'credits', 'turn_codes', 'staff_accounts', 'customers', 'prizes', 'campaigns'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
