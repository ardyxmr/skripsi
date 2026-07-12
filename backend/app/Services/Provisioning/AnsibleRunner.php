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
        // Stream output to the log AS IT RUNS (via the Process output callback) instead of writing it
        // only at the end — so the log EXISTS DURING a live run and can be `tail -f`'d to watch
        // progress. PYTHONUNBUFFERED stops Ansible from block-buffering its stdout when piped (not a
        // TTY), so task output lands in near-real-time rather than one big flush at the end.
        $logPath = "{$workspace}/ansible-execution.log";
        @file_put_contents($logPath, '$ ansible-playbook -i '.basename($inventory).' '.basename($playbook)."\n");

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
                'PYTHONUNBUFFERED' => '1',
            ])
            ->run(['ansible-playbook', '-i', $inventory, $playbook], function ($type, string $chunk) use ($logPath) {
                @file_put_contents($logPath, $chunk, FILE_APPEND);
            });

        return ['ok' => $res->successful(), 'output' => (string) @file_get_contents($logPath)];
    }
}
