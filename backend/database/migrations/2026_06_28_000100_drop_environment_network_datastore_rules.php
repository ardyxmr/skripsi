<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// The environment policy is a 3-way allow-list (provider/node/tier). Networks and datastores are
// admitted by NODE residency (the wizard filters them by the selected published node), and provisioning
// validates only provider/node/tier against the environment. These two pivot tables were never enforced
// (modeled but dead), so drop them. The remaining env rule tables: provider/tier/node.
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('environment_datastore_rules');
        Schema::dropIfExists('environment_network_rules');
    }

    public function down(): void
    {
        foreach (['environment_network_rules' => ['networks', 'network_id'], 'environment_datastore_rules' => ['datastores', 'datastore_id']] as $table => [$refTable, $refColumn]) {
            Schema::create($table, function (Blueprint $t) use ($refTable, $refColumn) {
                $t->id();
                $t->foreignId('environment_id')->constrained('environments')->cascadeOnDelete();
                $t->foreignId($refColumn)->constrained($refTable)->cascadeOnDelete();
                $t->unique(['environment_id', $refColumn]);
            });
        }
    }
};
