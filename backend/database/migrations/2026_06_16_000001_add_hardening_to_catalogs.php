<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stage 8: an OS-specific Ansible hardening playbook is bound to a catalog (admin upload). The file
// lives on the private disk at storage/app/catalog-hardening/{catalog_id}/; only metadata is stored.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogs', function (Blueprint $table) {
            $table->string('hardening_playbook_path')->nullable();
            $table->string('hardening_playbook_filename')->nullable();
            $table->string('hardening_playbook_checksum')->nullable(); // SHA-256
            $table->timestamp('hardening_updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('catalogs', function (Blueprint $table) {
            $table->dropColumn([
                'hardening_playbook_path', 'hardening_playbook_filename',
                'hardening_playbook_checksum', 'hardening_updated_at',
            ]);
        });
    }
};
