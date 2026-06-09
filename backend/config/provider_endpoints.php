<?php

// Per-provider-type endpoint map (04-backend-services.md §2.2 / api-get-proxmox.txt).
// Paths are relative to the provider's configured base endpoint.
return [
    'proxmox' => [
        'version' => '/version',
        'cluster_resources' => '/cluster/resources',           // ?type=node|vm|storage
        'node_network' => '/nodes/{node}/network',
        'vm_config' => '/nodes/{node}/qemu/{vmid}/config',
        'vm_agent_ifaces' => '/nodes/{node}/qemu/{vmid}/agent/network-get-interfaces',
    ],

    // Placeholders for future drivers.
    'openstack' => [],
    'olvm' => [],
];
