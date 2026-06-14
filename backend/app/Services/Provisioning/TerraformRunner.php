<?php

namespace App\Services\Provisioning;

use App\Models\Provider;
use Illuminate\Support\Facades\Process;

/**
 * Runs the Terraform CLI in a prepared workspace. Proxmox credentials are injected as
 * env vars (read by the Telmate/proxmox provider) so no secret is written to disk.
 * Each step's output is streamed to {workspace}/logs/. Stops at the first failing step.
 */
class TerraformRunner
{
    private const STEP_TIMEOUT = 900; // seconds — clone + cloud-init boot can be slow

    /** @return array{ok:bool, step:string, output:string} */
    public function apply(string $workspace, Provider $provider): array
    {
        $steps = [
            // ADR-18: plain `init` ONLY — never `-upgrade`. It respects each workspace's
            // .terraform.lock.hcl, keeping existing VMs frozen to their own provider version.
            // Upgrades are gated/forward-only (scripts/check-provider-compat.sh), not in-place.
            'init' => 'terraform init -input=false -no-color',
            'validate' => 'terraform validate -no-color',
            'plan' => 'terraform plan -input=false -no-color -out=tfplan',
            'apply' => 'terraform apply -input=false -no-color -auto-approve tfplan',
        ];

        return $this->runSteps($workspace, $provider, $steps);
    }

    /** Stage-7 use; kept here so destroy reuses the same env/log plumbing. */
    public function destroy(string $workspace, Provider $provider): array
    {
        return $this->runSteps($workspace, $provider, [
            'destroy' => 'terraform destroy -input=false -no-color -auto-approve',
        ]);
    }

    /** Parse `terraform output -json` → ['vmid'=>..., 'default_ipv4'=>...]. */
    public function outputs(string $workspace, Provider $provider): array
    {
        $res = Process::path($workspace)->env($this->env($provider))->timeout(60)
            ->run('terraform output -json');
        if (! $res->successful()) {
            return [];
        }
        $json = json_decode($res->output(), true) ?: [];

        return [
            'vmid' => $json['vmid']['value'] ?? null,
            'default_ipv4' => $json['default_ipv4']['value'] ?? null,
        ];
    }

    private function runSteps(string $workspace, Provider $provider, array $steps): array
    {
        $env = $this->env($provider);
        $combined = '';

        foreach ($steps as $name => $cmd) {
            $res = Process::path($workspace)->env($env)->timeout(self::STEP_TIMEOUT)->run($cmd);
            $log = "\$ {$cmd}\n".$res->output().$res->errorOutput();
            @file_put_contents("{$workspace}/logs/{$name}.log", $log);
            $combined .= $log."\n";

            if (! $res->successful()) {
                return ['ok' => false, 'step' => $name, 'output' => $combined];
            }
        }

        return ['ok' => true, 'step' => 'apply', 'output' => $combined];
    }

    private function env(Provider $provider): array
    {
        return [
            'PM_API_URL' => $provider->endpoint,
            'PM_API_TOKEN_ID' => $provider->provision_username.'!'.$provider->provision_token_id,
            'PM_API_TOKEN_SECRET' => $provider->provision_token_secret, // model decrypts on read
            'PM_TLS_INSECURE' => 'true',
        ];
    }
}
