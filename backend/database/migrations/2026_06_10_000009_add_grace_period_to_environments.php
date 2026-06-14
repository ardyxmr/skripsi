<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-environment grace period (aligns with the expiry policy). The expiry engine sets
// grace_period_until = expired_at + this window before auto-destroying.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('environments', function (Blueprint $table) {
            $table->string('grace_period_type')->default('days')->after('expiry_value');  // days | hours | minutes
            $table->integer('grace_period_value')->default(7)->after('grace_period_type'); // e.g. 7
        });
    }

    public function down(): void
    {
        Schema::table('environments', function (Blueprint $table) {
            $table->dropColumn(['grace_period_type', 'grace_period_value']);
        });
    }
};
