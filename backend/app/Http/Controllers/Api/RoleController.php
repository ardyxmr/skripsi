<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        // user_count → camelized to userCount (frontend normalizeRole).
        return response()->json(Role::withCount(['users as user_count'])->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $role = Role::create($data);
        $this->audit->log($request->user(), 'CREATE_ROLE', "Created role {$role->role_name}", $request);

        return response()->json($role->loadCount(['users as user_count']), 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $data = $request->validate([
            'role_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $role->update($data);
        $this->audit->log($request->user(), 'UPDATE_ROLE', "Updated role {$role->role_name}", $request);

        return response()->json($role->loadCount(['users as user_count']));
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        if (User::where('role_id', $role->id)->exists()) {
            abort(409, 'Role is still assigned to one or more users.');
        }

        $name = $role->role_name;
        $role->delete();
        $this->audit->log($request->user(), 'DELETE_ROLE', "Deleted role {$name}", $request);

        return response()->json(null, 204);
    }
}
