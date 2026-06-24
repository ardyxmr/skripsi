<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Approval workflow, decoupled from the request type (06-database-schema.md §5 / ADR-06).
// reference_id is polymorphic (provision_requests.id or inventory.id) — no FK constraint.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_type');                              // PROVISION | RENEWAL | PERMANENT | RESIZE | ADD_DISK | DESTROY
            $table->unsignedBigInteger('reference_id');                  // -> provision_requests.id | inventory.id
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('groups')->nullOnDelete();
            $table->string('status')->default('Pending');                // Pending | Approved | Rejected | Reverted
            $table->string('action_type')->nullable();                   // Approve | Reject | Revert
            $table->text('action_reason')->nullable();                   // mandatory when an action is taken
            $table->timestamp('action_date')->nullable();
            $table->timestamps();
            $table->index(['request_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_requests');
    }
};
