<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Inventory & lifecycle (06-database-schema.md §6). Created in Stage 6 so ProvisionVmJob
// can write a row per provisioned VM; lifecycle ACTIONS land in Stage 7. Stores PUBLISHED
// resource IDs (ADR-17) + per-VM workspace/state paths (ADR-08, per-VM). Runtime facts
// (ip/power/util) are mirrored from provider_vms by external_vmid, never read live by the UI.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('vm_name');
            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('environment_id')->nullable()->constrained('environments')->nullOnDelete();
            $table->foreignId('provider_id')->nullable()->constrained('providers')->nullOnDelete();
            $table->foreignId('node_id')->nullable()->constrained('nodes')->nullOnDelete();       // published
            $table->foreignId('catalog_id')->nullable()->constrained('catalogs')->nullOnDelete();
            $table->foreignId('tier_id')->nullable()->constrained('tiers')->nullOnDelete();
            $table->foreignId('network_id')->nullable()->constrained('networks')->nullOnDelete();
            $table->foreignId('datastore_id')->nullable()->constrained('datastores')->nullOnDelete();
            $table->string('ip_address')->nullable();          // synced from provider_vms
            $table->string('external_vmid')->nullable();       // provider VM id — correlation key
            $table->string('status')->default('Provisioning'); // Provisioning|Active|Failed|Expired|Deleted
            $table->string('observed_power_state')->nullable();// running|stopped|paused|unknown
            $table->integer('vcpu')->nullable();
            $table->integer('ram_mb')->nullable();
            $table->integer('disk_allocated_gb')->nullable();
            $table->decimal('cpu_utilization', 8, 4)->nullable();
            $table->integer('ram_usage_mb')->nullable();
            $table->boolean('security_hardening')->default(false);
            $table->string('hardening_status')->default('Not Requested'); // Not Requested|Pending|Running|Success|Failed
            $table->timestamp('expiry_date')->nullable();
            $table->timestamp('grace_period_until')->nullable();
            $table->boolean('is_permanent')->default(false);
            $table->string('workspace_path')->nullable();
            $table->string('terraform_state_path')->nullable();
            $table->string('error_message', 2048)->nullable(); // last apply error (failure path)
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_disks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventory')->cascadeOnDelete();
            $table->integer('disk_index');                 // 0 = boot disk
            $table->integer('size_gb');
            $table->boolean('is_primary')->default(false);
            $table->string('mount_point')->nullable();
            $table->string('fs_type')->nullable();
            $table->string('setup_status')->nullable();    // Pending Setup | Ready (boot = Ready)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_disks');
        Schema::dropIfExists('inventory');
    }
};
