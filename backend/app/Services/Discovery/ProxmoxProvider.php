<?php

namespace App\Services\Discovery;

use App\Models\Provider;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Proxmox VE read driver. Uses the provider's DISCOVERY credential for every
 * call. Auth header: PVEAPIToken={user}!{tokenId}={secret} (needs cluster-level
 * audit, e.g. PVEAuditor on /). Endpoints from config/provider_endpoints.php.
 */
class ProxmoxProvider implements ProviderDriver
{
    public function __construct(private Provider $provider) {}

    private function http(): PendingRequest
    {
        $auth = sprintf(
            'PVEAPIToken=%s!%s=%s',
            $this->provider->discovery_username,
            $this->provider->discovery_token_id,
            $this->provider->discovery_token_secret, // decrypted by the model cast
        );

        return Http::withoutVerifying()       // Proxmox typically uses a self-signed cert
            ->timeout(12)
            ->connectTimeout(8)
            ->withHeaders(['Authorization' => $auth]);
    }

    private function url(string $key, array $replace = []): string
    {
        $path = config("provider_endpoints.proxmox.$key");
        foreach ($replace as $k => $v) {
            $path = str_replace('{'.$k.'}', (string) $v, $path);
        }

        return rtrim($this->provider->endpoint, '/').$path;
    }

    public function testConnection(): array
    {
        try {
            $res = $this->http()->get($this->url('version'));

            if ($res->successful()) {
                return ['status' => 'Connected', 'version' => data_get($res->json(), 'data.version')];
            }

            return ['status' => 'Disconnected', 'version' => null, 'error' => "HTTP {$res->status()}"];
        } catch (\Throwable $e) {
            return ['status' => 'Disconnected', 'version' => null, 'error' => $e->getMessage()];
        }
    }

    public function getClusterResources(?string $type = null): array
    {
        $res = $this->http()->get($this->url('cluster_resources'), $type ? ['type' => $type] : []);
        $res->throw();

        return data_get($res->json(), 'data', []);
    }

    public function getNodeNetwork(string $node): array
    {
        $res = $this->http()->get($this->url('node_network', ['node' => $node]));
        $res->throw();

        return data_get($res->json(), 'data', []);
    }

    public function getVmConfig(string $node, int|string $vmid): array
    {
        $res = $this->http()->get($this->url('vm_config', ['node' => $node, 'vmid' => $vmid]));
        $res->throw();

        return data_get($res->json(), 'data', []);
    }

    public function getVmInterfaces(string $node, int|string $vmid): ?array
    {
        try {
            $res = $this->http()->get($this->url('vm_agent_ifaces', ['node' => $node, 'vmid' => $vmid]));
            if (! $res->successful()) {
                return null; // guest agent not installed/running
            }

            return data_get($res->json(), 'data.result', []);
        } catch (\Throwable) {
            return null;
        }
    }
}
