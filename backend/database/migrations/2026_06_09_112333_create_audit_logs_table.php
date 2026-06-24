<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Immutable, append-only business audit trail (06-database-schema.md §7).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('user_name');                  // snapshot at time of action
            $table->string('action_type');                // CREATE_VM | APPROVE_VM | LOGIN | ...
            $table->string('description');                // human-readable
            $table->string('ip_address')->nullable();
            $table->timestamp('created_at')->useCurrent(); // append-only; no updated_at
            $table->index(['action_type', 'created_at']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
