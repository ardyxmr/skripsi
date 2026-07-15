<?php

namespace App\Services;

/**
 * The audit trail's severity vocabulary, derived from (action_type + metadata).
 *
 * There is no severity column: audit_logs is append-only and predates this, so severity is
 * resolved on read. That also means old rows get the correct badge without a backfill.
 *
 * TWO AXES, and every action belongs to exactly one of them:
 *   * an OPERATION someone performed  → SUCCESS | FAILED
 *   * a HEALTH state the system observed → HEALTHY | WARNING | CRITICAL
 * plus UNKNOWN for out-of-band events the portal did not initiate and cannot judge.
 *
 * Keeping the axes separate is the whole point: "FAILED" for a disconnected provider says an
 * operation broke, when in fact nothing was attempted — the provider is simply down. Likewise a
 * capacity threshold is a warning to act on, not a failure.
 */
final class AuditSeverity
{
    public const SUCCESS = 'SUCCESS';

    public const FAILED = 'FAILED';

    public const HEALTHY = 'HEALTHY';

    public const WARNING = 'WARNING';

    public const CRITICAL = 'CRITICAL';

    public const UNKNOWN = 'UNKNOWN';

    /** Availability lost — something the portal manages is down or gone. */
    private const CRITICAL_ACTIONS = [
        'PROVIDER_DISCONNECTED',
        'VM_MISSING',
    ];

    /** Back in good standing after a CRITICAL/WARNING. */
    private const HEALTHY_ACTIONS = [
        'PROVIDER_RECONNECTED',
        'NODE_CAPACITY_RECOVERED',
    ];

    /** Needs attention, nothing broken yet. */
    private const WARNING_ACTIONS = [
        'VM_EXPIRED',
        'VM_GRACE_PERIOD',
    ];

    /** An attempted operation that did not complete. */
    private const FAILED_ACTIONS = [
        'LOGIN_FAILED',
        'LOGIN_THROTTLED',
        'PASSWORD_CHANGE_FAILED',
        'DISCOVERY_FAILED',
        'PROVISION_BLOCKED',
    ];

    /**
     * @param  array<string,mixed>  $metadata
     */
    public static function for(?string $actionType, array $metadata = []): string
    {
        $action = strtoupper((string) $actionType);

        // Capacity breaches already record which band they crossed (NodeController's capacity
        // events write metadata.band = ok|warning|critical), so read it instead of guessing.
        if ($action === 'NODE_CAPACITY_BREACH') {
            return match (strtolower((string) ($metadata['band'] ?? ''))) {
                'critical' => self::CRITICAL,
                'ok' => self::HEALTHY,
                default => self::WARNING,
            };
        }

        if (in_array($action, self::CRITICAL_ACTIONS, true)) {
            return self::CRITICAL;
        }
        if (in_array($action, self::HEALTHY_ACTIONS, true)) {
            return self::HEALTHY;
        }
        if (in_array($action, self::WARNING_ACTIONS, true)) {
            return self::WARNING;
        }
        if (in_array($action, self::FAILED_ACTIONS, true)) {
            return self::FAILED;
        }

        // An out-of-band shutdown the portal never initiated — it cannot be called success or failure.
        if ($action === 'POWER_OFF') {
            return self::UNKNOWN;
        }

        // Jobs record their outcome explicitly; trust it over the action name. This is what stops
        // "CREATE_VM → Provision FAILED …" from rendering green: the verb says CREATE_VM, only the
        // metadata knows it failed.
        $result = $metadata['result'] ?? null;
        if ($result !== null) {
            return strtolower((string) $result) === 'success' ? self::SUCCESS : self::FAILED;
        }

        return self::SUCCESS;
    }
}
