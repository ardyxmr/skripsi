<?php

namespace Tests\Feature\Node;

use App\Models\AuditLog;
use App\Models\ProviderNode;
use App\Services\NodeCapacityMonitor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsInfra;
use Tests\TestCase;

/**
 * Edge-triggered node-capacity alerting: a band change (ok↔warning↔critical) writes exactly one audit
 * event; a node sitting hot writes nothing more; crossing the line again fires a fresh event. These
 * audit rows are what the notification bell reads via /nodes/capacity-events.
 */
class NodeCapacityMonitorTest extends TestCase
{
    use BuildsInfra, RefreshDatabase;

    /** A discovered node whose only utilization signal is CPU (default thresholds 90/95). */
    private function pnodeAtCpu(float $cpu): ProviderNode
    {
        $pn = $this->providerNode($this->provider());
        $pn->forceFill(['status' => 'online', 'cpu_utilization' => $cpu, 'ram_usage_mb' => null, 'total_memory' => null])->save();

        return $pn->fresh();
    }

    public function test_first_healthy_observation_is_silent(): void
    {
        $pn = $this->pnodeAtCpu(5);            // ok
        app(NodeCapacityMonitor::class)->check($pn);

        $this->assertSame('ok', $pn->fresh()->capacity_band);
        $this->assertDatabaseCount('audit_logs', 0);
    }

    public function test_crossing_into_critical_audits_one_breach(): void
    {
        $pn = $this->pnodeAtCpu(99);           // critical
        app(NodeCapacityMonitor::class)->check($pn);
        app(NodeCapacityMonitor::class)->check($pn->fresh());   // still critical → no second event

        $this->assertSame('critical', $pn->fresh()->capacity_band);
        $this->assertSame(1, AuditLog::where('action_type', 'NODE_CAPACITY_BREACH')->count());
    }

    public function test_recovery_fires_once_and_recrossing_fires_again(): void
    {
        $monitor = app(NodeCapacityMonitor::class);
        $pn = $this->pnodeAtCpu(99);           // → breach
        $monitor->check($pn);

        $pn->forceFill(['cpu_utilization' => 5])->save();       // back to green
        $monitor->check($pn->fresh());
        $monitor->check($pn->fresh());          // still green → still one recovery

        $this->assertSame('ok', $pn->fresh()->capacity_band);
        $this->assertSame(1, AuditLog::where('action_type', 'NODE_CAPACITY_RECOVERED')->count());

        $pn->forceFill(['cpu_utilization' => 99])->save();      // cross again
        $monitor->check($pn->fresh());
        $this->assertSame(2, AuditLog::where('action_type', 'NODE_CAPACITY_BREACH')->count());
    }

    public function test_capacity_events_endpoint_returns_transitions_for_admin(): void
    {
        $pn = $this->pnodeAtCpu(99);
        app(NodeCapacityMonitor::class)->check($pn);            // writes a breach event
        Sanctum::actingAs($this->admin());

        $this->getJson('/api/nodes/capacity-events')
            ->assertOk()
            ->assertJsonFragment(['type' => 'NODE_CAPACITY_BREACH', 'node' => $pn->node_name, 'band' => 'critical']);
    }
}
