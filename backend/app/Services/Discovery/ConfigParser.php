<?php

namespace App\Services\Discovery;

/**
 * Parse a Proxmox /config map into allocation facts (04-backend-services.md §2.2a):
 *  - vCPU = sockets × cores (default sockets=1)
 *  - scan disk buses scsiX / virtioX / sataX / ideX
 *  - keep a line only if it has size= AND is NOT media=cdrom (efidisk0/tpmstate0/
 *    unusedX never match the bus regex, so they're excluded automatically)
 *  - normalize size NN[K|M|G|T] → integer GB
 */
class ConfigParser
{
    public static function parse(array $config): array
    {
        $sockets = (int) ($config['sockets'] ?? 1) ?: 1;
        $cores = (int) ($config['cores'] ?? 1) ?: 1;
        $vcpu = $sockets * $cores;

        $ramMb = (int) ($config['memory'] ?? 0); // Proxmox 'memory' is already MB

        $disks = [];
        foreach ($config as $key => $value) {
            if (! is_string($value)) {
                continue;
            }
            if (! preg_match('/^(scsi|virtio|sata|ide)\d+$/', $key)) {
                continue; // not a disk bus (skips efidisk0/tpmstate0/unusedX/net/etc.)
            }
            if (! str_contains($value, 'size=') || str_contains($value, 'media=cdrom')) {
                continue; // no size or it's a cdrom/cloud-init drive
            }

            $sizeGb = self::sizeToGb($value);
            if ($sizeGb !== null) {
                $disks[] = ['bus' => $key, 'size_gb' => $sizeGb];
            }
        }

        $diskAllocatedGb = array_sum(array_column($disks, 'size_gb'));

        return [
            'vcpu' => $vcpu,
            'ram_mb' => $ramMb,
            'disk_allocated_gb' => $diskAllocatedGb,
            'disks' => $disks,
        ];
    }

    private static function sizeToGb(string $diskValue): ?int
    {
        if (! preg_match('/size=(\d+(?:\.\d+)?)([KMGT])?/i', $diskValue, $m)) {
            return null;
        }
        $n = (float) $m[1];
        $unit = strtoupper($m[2] ?? 'G');

        $gb = match ($unit) {
            'K' => $n / 1024 / 1024,
            'M' => $n / 1024,
            'G' => $n,
            'T' => $n * 1024,
            default => $n,
        };

        return (int) round($gb);
    }
}
