<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Expiry engine: expire VMs past their window, auto-destroy after grace (Stage 7).
Schedule::command('vms:lifecycle')->everyMinute()->withoutOverlapping();

// Discovery freshness: tick every 10s, FINER than any provider cadence (15s/20s/30s/1m/2m), so the
// per-provider "due" check fires close to its true mark — eliminating the phase drift where a 30s
// tick could miss a provider's due-time by a second and defer detection ~30s. The command
// self-throttles per provider, so Proxmox is still only hit at each provider's own interval, not 10s.
Schedule::command('discovery:refresh')->everyTenSeconds()->withoutOverlapping();

// Stale cleanup: delete discovered resources Missing > 24h (keeps published-referenced ones).
Schedule::command('discovery:prune')->hourly();
