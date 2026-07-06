<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Role;
use App\Models\Tier;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

/**
 * First-run installer (WordPress-style). While the database has NO users the app is
 * "uninstalled": the frontend routes everything to /setup so the operator can create the
 * first administrator. The moment one user exists this endpoint self-locks (409) so it can
 * never be replayed to mint a rogue admin on a live system.
 *
 * Roles/group/tiers are system-defined (the RBAC code keys off the exact role names
 * Administrator/Manager/User), so they are seeded here automatically — never typed by the user.
 */
class SetupController extends Controller
{
    public function __construct(private AuditService $audit) {}

    /** Fresh-install probe: the app needs first-run setup while no users exist. */
    public function status(): JsonResponse
    {
        return response()->json(['needs_setup' => User::count() === 0]);
    }

    /** Create the bootstrap roles/group/tiers and the FIRST administrator, then close the gate. */
    public function store(Request $request): JsonResponse
    {
        // Self-lock: once anyone exists, setup is done — refuse.
        if (User::count() > 0) {
            abort(409, 'Setup has already been completed.');
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user = DB::transaction(function () use ($data) {
            // Bootstrap system data — mirrors DatabaseSeeder, idempotent by name.
            $adminRole = Role::firstOrCreate(['role_name' => 'Administrator'], ['description' => 'Full system access']);
            Role::firstOrCreate(['role_name' => 'Manager'], ['description' => 'Approve/reject/revert requests for the managed group']);
            Role::firstOrCreate(['role_name' => 'User'], ['description' => 'Request and manage own VMs']);

            $group = Group::firstOrCreate(
                ['group_name' => 'System Administrators'],
                ['room_floor' => null, 'description' => 'Bootstrap administrators group', 'manager_user_id' => null]
            );

            $admin = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role_id' => $adminRole->id,
                'group_id' => $group->id,
                'status' => 'Active',
                'auth_provider' => 'local',
            ]);

            // Backfill the group manager now that the admin exists (avoids the circular dependency).
            if ($group->manager_user_id === null) {
                $group->update(['manager_user_id' => $admin->id]);
            }

            // Authoritative default tiers (architecture-v2). Platinum is admin-creatable later.
            foreach ([
                ['Bronze', 2, 4096, 40, 'Small development workload'],
                ['Silver', 4, 8192, 80, 'Medium application workload'],
                ['Gold', 8, 16384, 160, 'Heavy database workload'],
            ] as [$name, $cpu, $ram, $disk, $desc]) {
                Tier::firstOrCreate(
                    ['tier_name' => $name],
                    ['cpu' => $cpu, 'ram_mb' => $ram, 'disk_gb' => $disk, 'status' => 'Active', 'description' => $desc, 'created_by' => $admin->id],
                );
            }

            return $admin;
        });

        $this->audit->log($user, 'SETUP_COMPLETED', "Initial administrator {$user->email} created via first-run setup", $request);

        // No auto-login — the operator lands on the login screen and signs in (WordPress flow).
        return response()->json(['message' => 'Setup completed. Please sign in.'], 201);
    }
}
