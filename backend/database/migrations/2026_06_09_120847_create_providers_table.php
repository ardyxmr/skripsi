<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Provider Discovery (06-database-schema.md §2). Secret columns hold ciphertext
// (Laravel 'encrypted' cast) and are never returned to the frontend.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('providers', function (Blueprint $table) {
            $table->id();
            $table->string('provider_name');
            $table->string('provider_type')->default('proxmox'); // proxmox | openstack | olvm
            $table->string('endpoint');                          // base API URL
            $table->text('description')->nullable();

            // Discovery credential (read-only, e.g. PVEAuditor)
            $table->string('discovery_username')->nullable();
            $table->string('discovery_token_id')->nullable();
            $table->text('discovery_token_secret')->nullable();  // ENCRYPTED

            // Provisioning credential (Terraform lifecycle)
            $table->string('provision_username')->nullable();
            $table->string('provision_token_id')->nullable();
            $table->text('provision_token_secret')->nullable();  // ENCRYPTED
            $table->string('terraform_provider_source')->nullable();   // e.g. Telmate/proxmox
            $table->string('terraform_provider_version')->nullable();  // e.g. 3.0.2-rc04

            $table->string('status')->default('Disconnected');         // Connected | Disconnected
            $table->string('discovery_status')->default('never_run');  // success|running|failed|partial|never_run
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamp('last_discovery_at')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->boolean('auto_discovery_enabled')->default(false);
            $table->string('discovery_interval')->nullable();          // 15m|30m|1h|6h|12h|24h
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
