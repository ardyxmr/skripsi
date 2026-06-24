<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\EnforcesUniqueness;
use App\Http\Controllers\Controller;
use App\Models\Tier;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class TierController extends Controller
{
    use EnforcesUniqueness;

    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        return response()->json(Tier::orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request, null);
        $data['created_by'] = $request->user()->id;

        $tier = Tier::create($data);
        $this->audit->log($request->user(), 'CREATE_TIER', "Created tier {$tier->tier_name}", $request);

        return response()->json($tier, 201);
    }

    public function update(Request $request, Tier $tier): JsonResponse
    {
        $tier->update($this->validateData($request, $tier));
        $this->audit->log($request->user(), 'UPDATE_TIER', "Updated tier {$tier->tier_name}", $request);

        return response()->json($tier);
    }

    public function destroy(Request $request, Tier $tier): JsonResponse
    {
        // Delete blocked if referenced by environment policy / inventory / requests.
        $refs = [
            'environment_tier_rules' => 'tier_id',
            'inventory' => 'tier_id',
            'provision_requests' => 'tier_id',
        ];
        foreach ($refs as $table => $column) {
            if (Schema::hasTable($table) && DB::table($table)->where($column, $tier->id)->exists()) {
                abort(409, 'Tier is in use by an environment policy, an active VM, or a request.');
            }
        }

        $name = $tier->tier_name;
        $tier->delete();
        $this->audit->log($request->user(), 'DELETE_TIER', "Deleted tier {$name}", $request);

        return response()->json(null, 204);
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            'total' => Tier::count(),
            'active' => Tier::where('status', 'Active')->count(),
            'inactive' => Tier::where('status', 'Inactive')->count(),
            'most_used_tier' => null, // sourced from inventory in Stage 7
        ]);
    }

    private function validateData(Request $request, ?Tier $tier): array
    {
        return $request->validate([
            'tier_name' => ['required', 'string', 'max:255', $this->uniqueNameCI('tiers', 'tier_name', $tier?->id)],
            'description' => ['nullable', 'string'],
            'cpu' => ['required', 'integer', 'min:1'],
            'ram_mb' => ['required', 'integer', 'min:1'],
            'disk_gb' => ['required', 'integer', 'min:1'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
        ]);
    }
}
