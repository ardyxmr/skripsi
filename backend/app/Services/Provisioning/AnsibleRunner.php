<?php

namespace App\Services\Provisioning;

use Illuminate\Support\Facades\Process;

/**
 * Runs an Ansible playbook against a single VM inside its isolated, retained hardening workspace
 * (mirrors TerraformRunner). The full output is written to ansible-execution.log for the audit
 * trail; SSH creds are NOT passed here — the dynamic inventory references the automation key by path.
 */
class AnsibleRunner
{
    private const TIMEOUT = 1500; // seconds — hardening playbooks can be slow

    /** @return array{ok:bool, output:string} */
    public function run(string $workspace, string $inventory, string $playbook): array
    {
        $res = Process::path($workspace)->timeout(self::TIMEOUT)
            ->env([
                'ANSIBLE_HOST_KEY_CHECKING' => 'False',
                'ANSIBLE_RETRY_FILES_ENABLED' => 'False',
                'ANSIBLE_NOCOLOR' => '1',
            ])
            ->run(['ansible-playbook', '-i', $inventory, $playbook]);

        $log = '$ ansible-playbook -i '.basename($inventory).' '.basename($playbook)."\n"
            .$res->output().$res->errorOutput();
        @file_put_contents("{$workspace}/ansible-execution.log", $log);

        return ['ok' => $res->successful(), 'output' => $log];
    }
}
