<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Duplicate-data protection (defense-in-depth behind the controller validation):
//  - CASE-INSENSITIVE unique index on every Settings entity's name (LOWER(name)), so the DB
//    rejects "Bronze"/"bronze" even if a write bypasses validation.
//  - Plain unique index on each published row's discovered-resource binding, enforcing
//    "one discovered artifact → one published row" (1 template→1 catalog, 1 bridge→1 network,
//    1 storage→1 datastore, 1 node→1 published node). Nullable bindings still allow many NULLs.
// PostgreSQL functional indexes — created via raw SQL since Schema can't express LOWER().
return new class extends Migration
{
    // table => column for case-insensitive name uniqueness
    private array $names = [
        'providers' => 'provider_name',
        'catalogs' => 'catalog_name',
        'networks' => 'network_name',
        'datastores' => 'datastore_name',
        'nodes' => 'node_name',
        'environments' => 'environment_name',
        'tiers' => 'tier_name',
        'users' => 'name',
        'roles' => 'role_name',
        'groups' => 'group_name',
    ];

    // table => column for the "one discovered artifact → one published row" bindings
    private array $bindings = [
        'catalogs' => 'provider_template_id',
        'networks' => 'provider_network_id',
        'datastores' => 'provider_datastore_id',
        'nodes' => 'provider_node_id',
    ];

    public function up(): void
    {
        foreach ($this->names as $table => $column) {
            $idx = "{$table}_{$column}_lower_unique";
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS {$idx} ON {$table} (LOWER({$column}))");
        }
        foreach ($this->bindings as $table => $column) {
            $idx = "{$table}_{$column}_unique";
            DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS {$idx} ON {$table} ({$column})");
        }
    }

    public function down(): void
    {
        foreach ($this->names as $table => $column) {
            DB::statement("DROP INDEX IF EXISTS {$table}_{$column}_lower_unique");
        }
        foreach ($this->bindings as $table => $column) {
            DB::statement("DROP INDEX IF EXISTS {$table}_{$column}_unique");
        }
    }
};
