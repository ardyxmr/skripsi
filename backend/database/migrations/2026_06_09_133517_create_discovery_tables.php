<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Discovered provider resources (06-database-schema.md §2). Discovery never
// deletes rows — absent resources are flagged discovered_status = Missing.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_nodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->string('external_node_id')->nullable();
            $table->string('node_name');
            $table->string('status')->nullable();        // online | offline | unknown
            $table->integer('cpu_count')->nullable();
            $table->bigInteger('total_memory')->nullable();
            $table->bigInteger('total_storage')->nullable();
            $table->string('discovered_status')->default('Active'); // Active | Missing
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'node_name']);
        });

        Schema::create('provider_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->string('external_template_id')->nullable();
            $table->string('template_name');
            $table->string('node_name')->nullable();
            $table->string('template_type')->nullable();
            $table->string('discovered_status')->default('Active');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'external_template_id']);
        });

        Schema::create('provider_networks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->string('node_name')->nullable();
            $table->string('network_name');              // bridge, e.g. vmbr0
            $table->string('network_type')->nullable();
            $table->string('cidr')->nullable();
            $table->string('gateway')->nullable();
            $table->string('discovered_status')->default('Active');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'node_name', 'network_name']);
        });

        Schema::create('provider_datastores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->string('node_name')->nullable();
            $table->string('datastore_name');            // storage id, e.g. local-lvm
            $table->string('datastore_type')->nullable();
            $table->bigInteger('total_space')->nullable();
            $table->bigInteger('available_space')->nullable();
            $table->string('discovered_status')->default('Active');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'node_name', 'datastore_name']);
        });

        Schema::create('provider_vms', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->string('external_vmid');             // correlation key to inventory
            $table->string('vm_name')->nullable();
            $table->string('power_state')->nullable();   // running | stopped | paused
            $table->string('ip_address')->nullable();
            $table->integer('vcpu')->nullable();         // sockets × cores
            $table->integer('ram_mb')->nullable();
            $table->integer('disk_allocated_gb')->nullable();
            $table->json('disks_json')->nullable();      // [{ bus:"scsi0", size_gb:32 }, ...]
            $table->decimal('cpu_utilization', 8, 4)->nullable();
            $table->integer('ram_usage_mb')->nullable();
            $table->string('discovered_status')->default('Active');
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamps();
            $table->unique(['provider_id', 'external_vmid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_vms');
        Schema::dropIfExists('provider_datastores');
        Schema::dropIfExists('provider_networks');
        Schema::dropIfExists('provider_templates');
        Schema::dropIfExists('provider_nodes');
    }
};
