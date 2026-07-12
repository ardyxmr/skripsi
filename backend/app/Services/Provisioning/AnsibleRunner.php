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
                // Put Ansible's temp dirs under /tmp instead of the login user's HOME. On the TARGET,
                // sysuser's ~/.ansible can be unwritable (expired/force-change account, odd home perms)
                // → "Failed to create temporary directory / UNREACHABLE". become-to-root can still read
                // a /tmp tmpfile. ANSIBLE_LOCAL_TEMP covers the control node the same way.
                'ANSIBLE_REMOTE_TMP' => '/tmp/.ansible-exovirt/tmp',
                'ANSIBLE_LOCAL_TEMP' => '/tmp/.ansible-exovirt/local',
            ])
            ->run(['ansible-playbook', '-i', $inventory, $playbook]);

        $log = '$ ansible-playbook -i '.basename($inventory).' '.basename($playbook)."\n"
            .$res->output().$res->errorOutput();
        @file_put_contents("{$workspace}/ansible-execution.log", $log);

        return ['ok' => $res->successful(), 'output' => $log];
    }
}
