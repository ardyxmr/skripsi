<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Hard backstop for the duplicate-VM-name guard (ProvisionRequestService/ApprovalController only
// guard at submit+approve, which a truly-simultaneous double-approve could still slip past). A
// PARTIAL UNIQUE INDEX on LOWER(vm_name) for non-Deleted rows mirrors the app rule exactly
// (case-insensitive; a Deleted VM's name is free to reuse). Because ProvisionVmJob creates the
// inventory row (status Provisioning) BEFORE `terraform apply`, a racing second job fails at the
// insert and never reaches Proxmox — so no duplicate Proxmox VM is created either.
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("CREATE UNIQUE INDEX IF NOT EXISTS inventory_active_vm_name_unique ON inventory (LOWER(vm_name)) WHERE status <> 'Deleted'");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS inventory_active_vm_name_unique');
    }
};
