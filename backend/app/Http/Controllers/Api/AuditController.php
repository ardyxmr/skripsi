<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Read-only access to the append-only audit trail. Administrator-only (mounted under the
 * role:Administrator group). Writes happen via AuditService from every state-changing action.
 */
class AuditController extends Controller
{
    private const PER_PAGE = [25, 50, 100, 200];

    // Server-side paginated list, newest first. Returns the page plus paging metadata and the
    // full distinct action-type vocabulary (so the filter dropdown isn't limited to the current page).
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 50);
        if (! in_array($perPage, self::PER_PAGE, true)) {
            $perPage = 50;
        }

        $page = $this->filtered($request)->paginate($perPage);

        return response()->json([
            'data' => $page->items(),
            'total' => $page->total(),
            'per_page' => $page->perPage(),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'action_types' => AuditLog::query()->distinct()->orderBy('action_type')->pluck('action_type'),
        ]);
    }

    // CSV export of the same filtered set (date range included via filtered()).
    public function export(Request $request): StreamedResponse
    {
        $query = $this->filtered($request);

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Timestamp', 'User', 'Action', 'Description', 'IP Address', 'Metadata']);
            foreach ($query->cursor() as $r) {
                fputcsv($out, [$r->id, $r->created_at, $r->user_name, $r->action_type, $r->description, $r->ip_address,
                    $r->metadata ? json_encode($r->metadata) : '']);
            }
            fclose($out);
        }, 'audit_trail.csv', ['Content-Type' => 'text/csv']);
    }

    // Shared query builder: action-type filter + free-text search + inclusive date range, newest first.
    // Accepts the action-type param in either snake_case or camelCase (depending on the client).
    private function filtered(Request $request)
    {
        $search = $request->query('search');
        $actionType = $request->query('action_type', $request->query('actionType'));
        $dateStart = $request->query('date_start');
        $dateEnd = $request->query('date_end');
        // Structured metadata filters — exact per-resource tracking via the jsonb GIN index (@>).
        // inventory_id is the authoritative unique key (Proxmox reuses vmid, so a vmid filter can
        // span instances); vmid stays as a familiar ops lookup. Match the JSON type: inventory_id /
        // environment_id are numbers, vmid is a string (varchar column).
        $inventoryId = $request->query('inventory_id', $request->query('inventoryId'));
        $vmid = $request->query('vmid');
        $environmentId = $request->query('environment_id', $request->query('environmentId'));

        return AuditLog::query()
            ->when($actionType, fn ($q) => $q->where('action_type', $actionType))
            ->when($inventoryId !== null && $inventoryId !== '', fn ($q) => $q->whereJsonContains('metadata', ['inventory_id' => (int) $inventoryId]))
            ->when($vmid !== null && $vmid !== '', fn ($q) => $q->whereJsonContains('metadata', ['vmid' => (string) $vmid]))
            ->when($environmentId !== null && $environmentId !== '', fn ($q) => $q->whereJsonContains('metadata', ['environment_id' => (int) $environmentId]))
            ->when($dateStart, fn ($q) => $q->whereDate('created_at', '>=', $dateStart))
            ->when($dateEnd, fn ($q) => $q->whereDate('created_at', '<=', $dateEnd))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('description', 'ilike', "%{$search}%")
                        ->orWhere('user_name', 'ilike', "%{$search}%")
                        ->orWhere('action_type', 'ilike', "%{$search}%")
                        ->orWhere('ip_address', 'ilike', "%{$search}%");
                });
            })
            ->orderByDesc('created_at');
    }
}
