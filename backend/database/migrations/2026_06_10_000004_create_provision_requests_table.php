<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Provision requests — IDs only, no approval/terraform/lifecycle state (06-database-schema.md §5).
// node_id is the PUBLISHED node (ADR-17); network/datastore are node-bound published rows.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provision_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requester_id')->constrained('users');
            $table->string('vm_name');
            $table->foreignId('environment_id')->constrained('environments');
            $table->foreignId('provider_id')->constrained('providers');
            $table->foreignId('node_id')->constrained('nodes');          // published
            $table->foreignId('catalog_id')->constrained('catalogs');
            $table->foreignId('tier_id')->constrained('tiers');
            $table->foreignId('network_id')->constrained('networks');    // published
            $table->foreignId('datastore_id')->constrained('datastores'); // published
            $table->integer('instance_count')->default(1);               // batch size
            $table->boolean('security_hardening')->default(false);
            $table->integer('boot_disk_gb')->nullable();
            $table->timestamp('requested_expiry')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provision_requests');
    }
};
