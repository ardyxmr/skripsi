<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Published networks + datastores abstracting discovered provider resources (§3).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('networks', function (Blueprint $table) {
            $table->id();
            $table->string('network_name');
            $table->text('description')->nullable();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->foreignId('provider_network_id')->nullable()->constrained('provider_networks')->nullOnDelete();
            $table->string('status')->default('Active');   // admin intent: Active | Inactive
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('datastores', function (Blueprint $table) {
            $table->id();
            $table->string('datastore_name');
            $table->text('description')->nullable();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->foreignId('provider_datastore_id')->nullable()->constrained('provider_datastores')->nullOnDelete();
            $table->string('status')->default('Active');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('datastores');
        Schema::dropIfExists('networks');
    }
};
