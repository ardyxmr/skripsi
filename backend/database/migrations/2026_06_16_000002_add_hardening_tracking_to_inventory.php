<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stage 8: per-VM hardening version tracking. `hardened_playbook_checksum` records which catalog
// playbook (SHA-256) was last applied so the UI can flag "playbook changed since last run".
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->timestamp('last_hardened_at')->nullable();
            $table->string('hardened_playbook_checksum')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropColumn(['last_hardened_at', 'hardened_playbook_checksum']);
        });
    }
};
