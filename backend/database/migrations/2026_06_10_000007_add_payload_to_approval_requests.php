<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stage 7: approvals for lifecycle actions (RESIZE/RENEWAL/...) carry the pending change
// (new cpu/ram, extension period, etc.) until they're approved and applied.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_requests', function (Blueprint $table) {
            $table->json('payload')->nullable()->after('group_id');
        });
    }

    public function down(): void
    {
        Schema::table('approval_requests', function (Blueprint $table) {
            $table->dropColumn('payload');
        });
    }
};
