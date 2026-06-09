<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        // Columns role_id/group_id/status/created_at camelize to what the frontend reads.
        return response()->json(
            User::select('id', 'name', 'email', 'role_id', 'group_id', 'status', 'created_at')
                ->orderBy('id')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'group_id' => ['required', 'integer', 'exists:groups,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
        ]);
        $data['password'] = Hash::make($data['password']);
        $data['status'] ??= 'Active';

        $user = User::create($data);
        $this->audit->log($request->user(), 'CREATE_USER', "Created user {$user->email}", $request);

        return response()->json($user->only('id', 'name', 'email', 'role_id', 'group_id', 'status', 'created_at'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'group_id' => ['required', 'integer', 'exists:groups,id'],
            'status' => ['nullable', Rule::in(['Active', 'Inactive'])],
        ]);
        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);
        $this->audit->log($request->user(), 'UPDATE_USER', "Updated user {$user->email}", $request);

        return response()->json($user->only('id', 'name', 'email', 'role_id', 'group_id', 'status', 'created_at'));
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if (Group::where('manager_user_id', $user->id)->exists()) {
            abort(409, 'User manages a group and cannot be deleted.');
        }

        $email = $user->email;
        $user->delete();
        $this->audit->log($request->user(), 'DELETE_USER', "Deleted user {$email}", $request);

        return response()->json(null, 204);
    }
}
