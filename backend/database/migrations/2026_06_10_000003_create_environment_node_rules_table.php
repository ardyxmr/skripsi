<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-environment published-node allow-list (published-node reconciliation §2.4).
// Mirrors environment_network_rules / environment_datastore_rules exactly.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environment_node_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('environment_id')->constrained('environments')->cascadeOnDelete();
            $table->foreignId('node_id')->constrained('nodes')->cascadeOnDelete();   // published
            $table->unique(['environment_id', 'node_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('environment_node_rules');
    }
};
