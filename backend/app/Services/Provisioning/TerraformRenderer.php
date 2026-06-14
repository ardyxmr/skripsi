<?php

namespace App\Services\Provisioning;

use App\Models\Provider;

/**
 * Renders the per-workspace files whose content varies (ADR-09): provider.tf (from the
 * provider's terraform source/version) and terraform.tfvars (resolved, IDs-free values).
 * Credentials are NOT written here — they are passed to Terraform as env vars by
 * TerraformRunner, so no secret ever lands on disk.
 */
class TerraformRenderer
{
    public function providerTf(Provider $provider): string
    {
        $source = $provider->terraform_provider_source;   // e.g. Telmate/proxmox
        $version = $provider->terraform_provider_version;  // e.g. 3.0.2-rc04

        return <<<HCL
        terraform {
          required_providers {
            proxmox = {
              source  = "{$source}"
              version = "{$version}"
            }
          }
        }

        # Endpoint + token come from env (PM_API_URL / PM_API_TOKEN_ID / PM_API_TOKEN_SECRET).
        provider "proxmox" {
          pm_tls_insecure = true
        }

        HCL;
    }

    /** Render an IDs-free value map as HCL assignments for terraform.tfvars. */
    public function tfvars(array $values): string
    {
        $lines = [];
        foreach ($values as $key => $value) {
            if ($value === null) {
                continue;
            }
            $lines[] = "{$key} = ".$this->hcl($value);
        }

        return implode("\n", $lines)."\n";
    }

    private function hcl(mixed $value): string
    {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }
        if (is_array($value)) {
            return $this->hclArray($value);
        }

        // String: escape quotes/backslashes.
        return '"'.str_replace(['\\', '"'], ['\\\\', '\\"'], (string) $value).'"';
    }

    /** A PHP list → HCL tuple `[a, b]`; an associative array → HCL object `{ k = v }`. */
    private function hclArray(array $value): string
    {
        if (array_is_list($value)) {
            return '['.implode(', ', array_map(fn ($v) => $this->hcl($v), $value)).']';
        }

        $pairs = [];
        foreach ($value as $k => $v) {
            $pairs[] = "{$k} = ".$this->hcl($v);
        }

        return '{ '.implode(', ', $pairs).' }';
    }
}
