<?php

namespace App\Services;

use App\Models\VmRequest;
use App\Models\VmsInventory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ProvisioningService
{
    public function provision(VmRequest $vmRequest)
    {
        $user = $vmRequest->user;
        $userName = str_replace(' ', '_', $user->name);
        $dateStr = date('dmY_His');
        $workspacePath = "provisioning/{$userName}/date_pr{$dateStr}";

        // Create the directory structure
        Storage::disk('local')->makeDirectory($workspacePath);
        $fullWorkspacePath = storage_path("app/{$workspacePath}");

        Log::info("Starting provisioning for VM Request ID: {$vmRequest->id} at {$fullWorkspacePath}");

        // Copy master Terraform files
        $masterPath = storage_path('app/master-provisioning/terraform');
        if (!is_dir($masterPath)) {
            Log::error("Master terraform directory not found at {$masterPath}");
            throw new \Exception("Master IaC directory missing.");
        }

        exec("cp -r {$masterPath}/* {$fullWorkspacePath}/");

        // Prepare Terraform Variables based on the request
        $tier = $vmRequest->tier;
        $catalog = $vmRequest->catalog;
        
        // In a real scenario, these should be loaded from .env or config
        $tfVars = [
            'proxmox_api_url' => env('PROXMOX_URL'),
            'proxmox_api_token_id' => env('PROXMOX_TOKEN_ID'),
            'proxmox_api_token_secret' => env('PROXMOX_TOKEN_SECRET'),
            'proxmox_node' => env('PROXMOX_NODE'),
            'vm_name' => $vmRequest->vm_name,
            'vmid' => 100 + $vmRequest->id, // Simple logic for demo, usually query PVE API for nextid
            'template_name' => $catalog->os_name, // e.g. "ubuntu-2404-template"
            'cpu_cores' => $tier->cpu_cores,
            'ram_mb' => $tier->ram_gb * 1024,
            'disk_size' => "{$tier->disk_gb}G",
            'storage_id' => env('PROXMOX_STORAGE', 'local-lvm'),
            'network_bridge' => env('PROXMOX_BRIDGE', 'vmbr0'),
            'ssh_public_key' => env('PROXMOX_SSH_PUB_KEY', 'ssh-ed25519 AAAAC3...'),
        ];

        // Write terraform.tfvars
        $tfVarsContent = "";
        foreach ($tfVars as $key => $value) {
            $val = is_numeric($value) && !str_ends_with($value, 'G') ? $value : "\"{$value}\"";
            $tfVarsContent .= "{$key} = {$val}\n";
        }
        file_put_contents("{$fullWorkspacePath}/terraform.tfvars", $tfVarsContent);

        // Run Terraform Init
        $processInit = new Process(['terraform', 'init'], $fullWorkspacePath);
        $processInit->setTimeout(120);
        $processInit->run();
        
        if (!$processInit->isSuccessful()) {
            Log::error("Terraform Init Failed: " . $processInit->getErrorOutput());
            $vmRequest->update(['status' => 'failed']);
            return false;
        }

        // Run Terraform Apply
        $processApply = new Process(['terraform', 'apply', '-auto-approve'], $fullWorkspacePath);
        $processApply->setTimeout(300);
        $processApply->run();

        if (!$processApply->isSuccessful()) {
            Log::error("Terraform Apply Failed: " . $processApply->getErrorOutput());
            $vmRequest->update(['status' => 'failed']);
            return false;
        }

        Log::info("Terraform Apply Succeeded for VM Request ID: {$vmRequest->id}");

        // Optionally, parse terraform output to get IP
        $processOutput = new Process(['terraform', 'output', '-raw', 'vm_ip'], $fullWorkspacePath);
        $processOutput->run();
        $vmIp = trim($processOutput->getOutput());

        // Update Request Status
        $vmRequest->update(['status' => 'completed']);

        // Insert into Inventory
        VmsInventory::create([
            'user_id' => $user->id,
            'group_id' => $vmRequest->group_id,
            'vm_name' => $vmRequest->vm_name,
            'proxmox_vmid' => $tfVars['vmid'],
            'status' => 'running',
            'ip_address' => $vmIp
        ]);

        return true;
    }
}
