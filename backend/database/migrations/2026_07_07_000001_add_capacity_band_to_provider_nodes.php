<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Last-observed capacity band (ok|warning|critical) per node. Discovery compares the freshly computed
// band to this and, ONLY on a change, writes a NODE_CAPACITY_BREACH/RECOVERED audit event — the same
// edge-triggered pattern as provider connect/disconnect, so a node sitting hot doesn't flood the trail.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->string('capacity_band')->nullable()->after('block_on_critical');
        });
    }

    public function down(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->dropColumn('capacity_band');
        });
    }
};
