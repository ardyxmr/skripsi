<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Expiry engine: expire VMs past their window, auto-destroy after grace (Stage 7).
Schedule::command('vms:lifecycle')->everyMinute()->withoutOverlapping();

// Discovery freshness: tick at the finest interval (30s) — the command itself decides per provider
// whether its configured cadence (30s/1m/2m) has elapsed before re-discovering + mirroring facts.
Schedule::command('discovery:refresh')->everyThirtySeconds()->withoutOverlapping();

// Stale cleanup: delete discovered resources Missing > 24h (keeps published-referenced ones).
Schedule::command('discovery:prune')->hourly();
