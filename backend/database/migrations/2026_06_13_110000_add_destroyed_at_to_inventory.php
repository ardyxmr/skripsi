<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// When a VM is destroyed it keeps its row + workspace for audit/lineage (ADR-08), but it should
// drop off the Inventory listing shortly after. `destroyed_at` records when it became Deleted so the
// index can hide it past a retention window (config `provisioning.deleted_retention_minutes`, 5m).
// Named `destroyed_at` (not `deleted_at`) to avoid Laravel's SoftDeletes magic — this model uses an
// explicit `status='Deleted'`, not soft deletes.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->timestamp('destroyed_at')->nullable();
        });

        // Backfill existing Deleted rows so they fall outside the retention window immediately.
        DB::table('inventory')->where('status', 'Deleted')->whereNull('destroyed_at')
            ->update(['destroyed_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('inventory', fn (Blueprint $table) => $table->dropColumn('destroyed_at'));
    }
};
