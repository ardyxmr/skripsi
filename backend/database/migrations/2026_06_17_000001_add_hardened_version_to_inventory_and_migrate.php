<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Adds inventory.hardened_version_id and MIGRATES the existing single-playbook model into the new
// catalog_hardening_versions table (one "Imported 1.0" row per catalog), backfills which version each
// already-hardened VM ran (by checksum), then drops the now-redundant catalogs.hardening_* columns.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $t) {
            $t->foreignId('hardened_version_id')->nullable()->after('hardening_status')
                ->constrained('catalog_hardening_versions')->nullOnDelete();
        });

        // 1) Existing single playbook per catalog -> one version row (file path reused as-is on disk).
        $now = now();
        foreach (DB::table('catalogs')->whereNotNull('hardening_playbook_path')->get() as $c) {
            $versionId = DB::table('catalog_hardening_versions')->insertGetId([
                'catalog_id' => $c->id,
                'name' => 'Imported',
                'version' => '1.0',
                'playbook_path' => $c->hardening_playbook_path,
                'playbook_filename' => $c->hardening_playbook_filename ?? 'playbook.yml',
                'checksum' => $c->hardening_playbook_checksum ?? '',
                'is_active' => true,
                'uploaded_by' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            // 2) Backfill already-hardened VMs of this catalog whose checksum matches.
            DB::table('inventory')
                ->where('catalog_id', $c->id)
                ->where('hardening_status', 'Success')
                ->where('hardened_playbook_checksum', $c->hardening_playbook_checksum)
                ->update(['hardened_version_id' => $versionId]);
        }

        // 3) Drop the now-redundant single-playbook columns (versions table is the source of truth).
        Schema::table('catalogs', function (Blueprint $t) {
            $t->dropColumn([
                'hardening_playbook_path', 'hardening_playbook_filename',
                'hardening_playbook_checksum', 'hardening_updated_at',
            ]);
        });
    }

    public function down(): void
    {
        // Re-add the catalog columns and copy back the latest active version per catalog.
        Schema::table('catalogs', function (Blueprint $t) {
            $t->string('hardening_playbook_path')->nullable();
            $t->string('hardening_playbook_filename')->nullable();
            $t->string('hardening_playbook_checksum')->nullable();
            $t->timestamp('hardening_updated_at')->nullable();
        });
        foreach (DB::table('catalogs')->pluck('id') as $catalogId) {
            $v = DB::table('catalog_hardening_versions')
                ->where('catalog_id', $catalogId)->where('is_active', true)
                ->latest('id')->first();
            if ($v) {
                DB::table('catalogs')->where('id', $catalogId)->update([
                    'hardening_playbook_path' => $v->playbook_path,
                    'hardening_playbook_filename' => $v->playbook_filename,
                    'hardening_playbook_checksum' => $v->checksum,
                    'hardening_updated_at' => $v->updated_at,
                ]);
            }
        }
        Schema::table('inventory', function (Blueprint $t) {
            $t->dropConstrainedForeignId('hardened_version_id');
        });
    }
};
