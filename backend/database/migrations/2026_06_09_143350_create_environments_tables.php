<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Environment policy + four allow-list rule tables (§4 Policy Layer).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('environments', function (Blueprint $table) {
            $table->id();
            $table->string('environment_name');
            $table->text('description')->nullable();
            $table->string('expiry_type')->default('days');   // days | permanent/lifetime | custom
            $table->integer('expiry_value')->nullable();      // e.g. 30 (null for lifetime)
            $table->boolean('approval_required')->default(true);
            $table->boolean('allow_data_disk')->default(false);
            $table->string('status')->default('Active');      // Active | Inactive
            $table->integer('display_order')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $rule = function (string $table, string $refTable, string $refColumn) {
            Schema::create($table, function (Blueprint $t) use ($refTable, $refColumn) {
                $t->id();
                $t->foreignId('environment_id')->constrained('environments')->cascadeOnDelete();
                $t->foreignId($refColumn)->constrained($refTable)->cascadeOnDelete();
                $t->unique(['environment_id', $refColumn]);
            });
        };

        $rule('environment_provider_rules', 'providers', 'provider_id');
        $rule('environment_tier_rules', 'tiers', 'tier_id');
        $rule('environment_network_rules', 'networks', 'network_id');     // published
        $rule('environment_datastore_rules', 'datastores', 'datastore_id'); // published
    }

    public function down(): void
    {
        Schema::dropIfExists('environment_datastore_rules');
        Schema::dropIfExists('environment_network_rules');
        Schema::dropIfExists('environment_tier_rules');
        Schema::dropIfExists('environment_provider_rules');
        Schema::dropIfExists('environments');
    }
};
