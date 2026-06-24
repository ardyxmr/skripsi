<?php

namespace App\Console\Commands;

use App\Services\LifecycleEngineService;
use Illuminate\Console\Command;

// Scheduled every minute (routes/console.php). --grace overrides the configured window (testing).
class RunVmLifecycle extends Command
{
    protected $signature = 'vms:lifecycle {--grace= : grace window in minutes (overrides config)}';

    protected $description = 'Expire VMs past their expiry and auto-destroy them after the grace window';

    public function handle(LifecycleEngineService $engine): int
    {
        $grace = $this->option('grace') !== null ? (int) $this->option('grace') : null;
        $r = $engine->run($grace);
        $this->info("vms:lifecycle → expired={$r['expired']} destroyed={$r['destroyed']}");

        return self::SUCCESS;
    }
}
