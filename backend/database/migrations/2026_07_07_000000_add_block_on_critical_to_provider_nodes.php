<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Admin opt-in hard-block: when true AND the node's capacity is Critical, provisioning onto this
// node is refused (wizard grays it out, approve is rejected). Lives on the PHYSICAL node so it is
// discovery-safe — DiscoveryService::updateOrCreate only writes the utilization columns and never
// touches this flag, so an admin's choice survives every re-discovery.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->boolean('block_on_critical')->default(false)->after('ram_usage_mb');
        });
    }

    public function down(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->dropColumn('block_on_critical');
        });
    }
};
