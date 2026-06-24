<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Published nodes — the fourth published abstraction alongside networks/datastores
// (published-node reconciliation §2.1 / ADR-17). A friendly-named pointer to exactly
// one discovered provider_nodes row; users select by name, never the raw node.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nodes', function (Blueprint $table) {
            $table->id();
            $table->string('node_name');                       // friendly, e.g. "Jakarta Zone A"
            $table->text('description')->nullable();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->string('status')->default('Active');       // admin intent: Active | Inactive
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['provider_id', 'node_name']);      // friendly name unique within a provider
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nodes');
    }
};
