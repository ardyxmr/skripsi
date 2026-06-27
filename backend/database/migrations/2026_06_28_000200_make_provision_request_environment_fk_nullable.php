<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// provision_requests.environment_id was NOT NULL + RESTRICT, so an environment could never be deleted
// once any request referenced it (Development had 56). Make it nullable + ON DELETE SET NULL, matching
// the artifact FKs (2026_06_28_000000) and inventory.environment_id. The request row keeps its
// vm_name/specs; only the environment link nulls. EnvironmentController@destroy still blocks (409)
// while LIVE VMs belong to the environment, so deletion never orphans a running VM from its policy.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provision_requests', function (Blueprint $table) {
            $table->dropForeign(['environment_id']);
            $table->unsignedBigInteger('environment_id')->nullable()->change();
            $table->foreign('environment_id')->references('id')->on('environments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('provision_requests', function (Blueprint $table) {
            $table->dropForeign(['environment_id']);
            $table->unsignedBigInteger('environment_id')->nullable(false)->change();
            $table->foreign('environment_id')->references('id')->on('environments')->restrictOnDelete();
        });
    }
};
