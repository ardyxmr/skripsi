<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Stage 7: link each VM back to the request that created it, so retry can re-dispatch
// the original ProvisionVmJob (reusing this row + its workspace) and for audit lineage.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->foreignId('provision_request_id')->nullable()->after('id')
                ->constrained('provision_requests')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropConstrainedForeignId('provision_request_id');
        });
    }
};
