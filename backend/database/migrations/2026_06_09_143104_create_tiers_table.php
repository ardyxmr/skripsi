<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Resource tiers — blueprints users pick instead of raw CPU/RAM/disk (§4).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tiers', function (Blueprint $table) {
            $table->id();
            $table->string('tier_name');                // Bronze | Silver | Gold | Platinum
            $table->text('description')->nullable();
            $table->integer('cpu');                     // vCPU
            $table->integer('ram_mb');                  // memory in MB
            $table->integer('disk_gb');                 // disk in GB
            $table->string('status')->default('Active'); // Active | Inactive
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            // future: max_instances (capacity control, not v1)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tiers');
    }
};
