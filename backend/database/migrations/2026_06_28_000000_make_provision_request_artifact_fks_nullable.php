<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// provision_requests is a historical log. Its published-artifact FKs were NOT NULL + RESTRICT, so a
// catalog/network/datastore/node/tier could never be deleted once any request referenced it — even
// with zero live VMs. Make them nullable + ON DELETE SET NULL (matching inventory's existing behavior)
// so admins can retire unused published artifacts; the request row keeps vm_name/specs, only the
// artifact link nulls. requester/environment/provider stay RESTRICT (heavier lifecycle, handled apart).
return new class extends Migration
{
    private array $fks = [
        'catalog_id' => 'catalogs',
        'network_id' => 'networks',
        'datastore_id' => 'datastores',
        'node_id' => 'nodes',
        'tier_id' => 'tiers',
    ];

    public function up(): void
    {
        Schema::table('provision_requests', function (Blueprint $table) {
            foreach ($this->fks as $col => $refTable) {
                $table->dropForeign([$col]);
                $table->unsignedBigInteger($col)->nullable()->change();
                $table->foreign($col)->references('id')->on($refTable)->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('provision_requests', function (Blueprint $table) {
            foreach ($this->fks as $col => $refTable) {
                $table->dropForeign([$col]);
                $table->unsignedBigInteger($col)->nullable(false)->change();
                $table->foreign($col)->references('id')->on($refTable)->restrictOnDelete();
            }
        });
    }
};
