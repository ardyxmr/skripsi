<?php

return [
    // Grace window (minutes) between a VM expiring and being auto-destroyed.
    // Default 7 days; override with VM_GRACE_MINUTES (e.g. for testing).
    'grace_minutes' => (int) env('VM_GRACE_MINUTES', 7 * 24 * 60),

    // Which provisioning stub new VMs use (ADR-18 §4). 'structured' = non-deprecated Telmate
    // `disks` block (default); 'legacy' = deprecated indexable `disk` list. Existing VMs are
    // frozen to whatever they were provisioned with — this only affects NEW provisions.
    'stub_variant' => env('PROVISIONING_STUB_VARIANT', 'structured'),

    // Physical maximum data disks a VM can have — the HARD infrastructure ceiling. This MUST
    // equal the number of dynamic `scsiN` slots declared in the structured stub's main.tf.
    // Per-environment `max_data_disks` is a softer policy cap that must stay <= this value.
    'max_data_disk_slots' => (int) env('VM_MAX_DATA_DISK_SLOTS', 6),

    // Max CPU cores a VM is BUILT with (the fixed topology). The tier's vCPU count is the number
    // brought ONLINE (`vcpus`); the gap is hot-pluggable headroom — a CPU resize raises/lowers
    // online vCPUs live, up to this ceiling, with no reboot. Must be >= the largest tier's cpu.
    'max_cpu_cores' => (int) env('VM_MAX_CPU_CORES', 8),

    // How long a destroyed (status=Deleted) VM stays visible in the Inventory listing before it is
    // hidden. The row + workspace are retained (ADR-08); this only controls the listing. Override
    // with VM_DELETED_RETENTION_MINUTES.
    'deleted_retention_minutes' => (int) env('VM_DELETED_RETENTION_MINUTES', 5),

    // How long a discovered resource may stay flagged Missing before discovery:prune deletes it.
    // VMs are pruned unconditionally; templates/networks/datastores/nodes still bound to a
    // published row are kept (unpublish them first). Override with DISCOVERY_STALE_HOURS.
    'discovery_stale_hours' => (int) env('DISCOVERY_STALE_HOURS', 24),
];
