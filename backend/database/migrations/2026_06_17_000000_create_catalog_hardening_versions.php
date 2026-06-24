<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Versioning enhancement: a catalog has MANY named/versioned hardening playbooks (e.g. "CIS v1.0").
// Versions are immutable (each upload = new row + its own file dir) and retired via is_active, never
// hard-deleted, so a VM's inventory.hardened_version_id reference never dangles.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_hardening_versions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('catalog_id')->constrained()->cascadeOnDelete();
            $t->string('name');                 // "CIS Benchmark"
            $t->string('version');              // "1.0"
            $t->string('playbook_path');        // private disk: catalog-hardening/{catalog_id}/{version_id}/...
            $t->string('playbook_filename');
            $t->string('checksum');             // SHA-256
            $t->boolean('is_active')->default(true);
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_hardening_versions');
    }
};
