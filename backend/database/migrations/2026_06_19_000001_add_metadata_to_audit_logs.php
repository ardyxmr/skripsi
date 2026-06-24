<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Structured payload for audit rows (vmid, vm_name, environment_id, …) so per-resource
// filtering is exact (metadata->>'vmid') instead of parsing the human description string.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->jsonb('metadata')->nullable()->after('ip_address');
        });

        // GIN index → fast containment/`->>` lookups when filtering the trail by vmid/env (Postgres).
        DB::statement('CREATE INDEX IF NOT EXISTS audit_logs_metadata_gin ON audit_logs USING gin (metadata)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS audit_logs_metadata_gin');
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn('metadata');
        });
    }
};
