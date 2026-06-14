<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Provider Management is the source of truth → auto-discovery must default ON so its DB snapshot
// never goes stale. (1) Flip the column defaults for new rows; (2) migrate existing providers to
// auto-on @ 2m (their old long intervals like 15m/30m are no longer valid options).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->boolean('auto_discovery_enabled')->default(true)->change();
            $table->string('discovery_interval')->default('2m')->nullable()->change();
        });

        DB::table('providers')->update([
            'auto_discovery_enabled' => true,
            'discovery_interval' => '2m',
        ]);
    }

    public function down(): void
    {
        Schema::table('providers', function (Blueprint $table) {
            $table->boolean('auto_discovery_enabled')->default(false)->change();
            $table->string('discovery_interval')->nullable()->change();
        });
    }
};
