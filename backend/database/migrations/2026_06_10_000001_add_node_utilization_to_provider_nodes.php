<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Node-level point-in-time utilization snapshot (published-node reconciliation §2.2).
// Same contract as provider_vms.cpu_utilization/ram_usage_mb — a snapshot, not a series.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->decimal('cpu_utilization', 8, 4)->nullable()->after('total_storage'); // % from /cluster/resources?type=node `cpu`
            $table->bigInteger('ram_usage_mb')->nullable()->after('cpu_utilization');      // used MB from `mem`
        });
    }

    public function down(): void
    {
        Schema::table('provider_nodes', function (Blueprint $table) {
            $table->dropColumn(['cpu_utilization', 'ram_usage_mb']);
        });
    }
};
