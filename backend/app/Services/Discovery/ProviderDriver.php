<?php

namespace App\Services\Discovery;

/**
 * Provider-agnostic read driver. ALL provider GET traffic (resources + VM
 * runtime facts) flows through an implementation of this interface; no other
 * layer calls the provider (04-backend-services.md §2.1, ADR-01/ADR-10).
 * Drivers never persist — they return raw/normalized arrays.
 */
interface ProviderDriver
{
    /** @return array{status: string, version: ?string, error?: string} */
    public function testConnection(): array;

    /** Raw `/cluster/resources` rows (optionally filtered by type=node|vm|storage). */
    public function getClusterResources(?string $type = null): array;

    /** Raw `/nodes/{node}/network` rows. */
    public function getNodeNetwork(string $node): array;

    /** Raw `/nodes/{node}/qemu/{vmid}/config` map (sockets, cores, memory, disk strings…). */
    public function getVmConfig(string $node, int|string $vmid): array;

    /** Guest-agent interfaces for IP discovery, or null if the agent is unavailable. */
    public function getVmInterfaces(string $node, int|string $vmid): ?array;
}
