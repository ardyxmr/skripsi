<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Laravel's foreignId()->constrained() creates the FK *constraint* but not an index on the
// column — Postgres, unlike MySQL, does not auto-index foreign keys. On the tables that
// accumulate rows over time (inventory, provision_requests, the provider_* sync tables),
// an unindexed FK means sequential scans on joins and on parent-row deletes once the data
// grows. These covering indexes are preventive: harmless at today's size, correct as the
// data set grows. Lookup/static tables (users.role_id, etc.) are intentionally left alone.
//
// Index names follow Laravel's default convention ({table}_{column}_index); IF NOT EXISTS
// keeps the migration idempotent and safe to re-run.
return new class extends Migration
{
    /** @var array<string, string[]> table => FK columns needing a covering index */
    private array $fkIndexes = [
        'inventory' => [
            'provider_id', 'node_id', 'catalog_id', 'tier_id', 'network_id',
            'datastore_id', 'provision_request_id', 'hardened_version_id',
            'owner_user_id', 'environment_id',
        ],
        'provision_requests' => [
            'requester_id', 'environment_id', 'provider_id', 'catalog_id',
            'tier_id', 'network_id', 'node_id', 'datastore_id',
        ],
        'provider_vms'               => ['provider_node_id'],
        'provider_networks'          => ['provider_node_id'],
        'provider_datastores'        => ['provider_node_id'],
        'provider_templates'         => ['provider_node_id'],
        'inventory_disks'            => ['inventory_id'],
        'approval_requests'          => ['group_id', 'requester_id', 'approver_id'],
        'catalog_hardening_versions' => ['catalog_id', 'uploaded_by'],
    ];

    public function up(): void
    {
        foreach ($this->fkIndexes as $table => $columns) {
            foreach ($columns as $column) {
                $name = "{$table}_{$column}_index";
                DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$table} ({$column})");
            }
        }
    }

    public function down(): void
    {
        foreach ($this->fkIndexes as $table => $columns) {
            foreach ($columns as $column) {
                $name = "{$table}_{$column}_index";
                DB::statement("DROP INDEX IF EXISTS {$name}");
            }
        }
    }
};
