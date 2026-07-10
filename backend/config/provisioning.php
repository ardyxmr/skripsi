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

    // cloud-init login user created on every provisioned VM (ci_user). The password is generated
    // PER VM (strong, random, alphanumeric) at provision time, stored encrypted on the inventory row,
    // and revealed only via the audited GET /inventory/{id}/credentials endpoint.
    'ci_user' => env('PROVISION_CI_USER', 'sysuser'),

    // Ansible hardening (Stage 8). A dedicated automation keypair is injected into every NEW VM via
    // cloud-init (public key on the ci_user) so Ansible connects KEY-based — independent of the
    // template's ssh_pwauth. The private key stays on the worker (never copied into a workspace).
    'ansible_ssh_user' => env('ANSIBLE_SSH_USER', env('PROVISION_CI_USER', 'sysuser')),
    'ansible_public_key_path' => env('ANSIBLE_PUBLIC_KEY_PATH', storage_path('app/ansible/automation_key.pub')),
    'ansible_private_key_path' => env('ANSIBLE_PRIVATE_KEY_PATH', storage_path('app/ansible/automation_key')),

    // Max CPU cores a VM is BUILT with (the fixed topology). The tier's vCPU count is the number
    // brought ONLINE (`vcpus`); the gap is hot-pluggable headroom — a CPU resize raises/lowers
    // online vCPUs live, up to this ceiling, with no reboot. Must be >= the largest tier's cpu.
    'max_cpu_cores' => (int) env('VM_MAX_CPU_CORES', 8),

    // How long a destroyed (status=Deleted) VM stays visible in the Inventory listing before it is
    // hidden. The row + workspace are retained (ADR-08); this only controls the listing. Override
    // with VM_DELETED_RETENTION_MINUTES.
    'deleted_retention_minutes' => (int) env('VM_DELETED_RETENTION_MINUTES', 5),

    // How long (in MINUTES) a discovered resource may stay flagged Missing in the Discovery/Node
    // Explorer before discovery:prune deletes it — so a VM deleted straight in Proxmox stops
    // lingering as "Missing" forever. VMs are pruned unconditionally; templates/networks/datastores/
    // nodes still bound to a published row are kept (unpublish them first). Override with
    // DISCOVERY_STALE_MINUTES. The scheduler runs prune every minute (routes/console.php), so a
    // Missing item disappears ~5–6 min after it was last actually seen.
    'discovery_stale_minutes' => (int) env('DISCOVERY_STALE_MINUTES', 5),

    // --- Phase 3 sync hardening (ProviderSyncGuard) ---

    // Circuit breaker: after this many consecutive live-API failures to a provider, AUTOMATED
    // callers (scheduled discovery:refresh + SyncVmFactsJob) skip live calls to it for the
    // cooldown below (last-known DB facts stand) instead of hammering a down Proxmox host. A
    // manual Discover/sync always still attempts (a success closes the breaker).
    'circuit_failure_threshold' => (int) env('PROVIDER_CB_FAILURE_THRESHOLD', 3),
    'circuit_cooldown_seconds' => (int) env('PROVIDER_CB_COOLDOWN_SECONDS', 60),

    // Targeted-sync throttle: collapse duplicate SyncVmFactsJob triggers for the SAME VM landing
    // within this window into a single live call (one active sync chain per VM). MUST stay below
    // the bounded IP follow-up delay (5s) so the chain never throttles itself.
    'sync_throttle_seconds' => (int) env('VM_SYNC_THROTTLE_SECONDS', 3),

    // --- Node capacity thresholds (CPU / RAM / datastore utilization) ---
    // Two tiers computed from the discovered node snapshot. `warn` = amber informational badge in the
    // wizard/approval/node list (never blocks). `critical` = red; it only BLOCKS provisioning when an
    // admin has opted the node in (provider_nodes.block_on_critical). Whichever resource peaks highest
    // drives the level. Override for smoke-testing.
    'node_capacity_warn_pct' => (int) env('NODE_CAPACITY_WARN_PCT', 90),
    'node_capacity_critical_pct' => (int) env('NODE_CAPACITY_CRITICAL_PCT', 95),
];
