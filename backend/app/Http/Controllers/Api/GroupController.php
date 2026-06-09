<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(): JsonResponse
    {
        // member_count → camelized to memberCount (frontend normalizeGroup).
        return response()->json(Group::withCount(['users as member_count'])->orderBy('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        $group = Group::create($data);
        $this->audit->log($request->user(), 'CREATE_GROUP', "Created group {$group->group_name}", $request);

        return response()->json($group->loadCount(['users as member_count']), 201);
    }

    public function update(Request $request, Group $group): JsonResponse
    {
        $data = $this->validateData($request);

        $group->update($data);
        $this->audit->log($request->user(), 'UPDATE_GROUP', "Updated group {$group->group_name}", $request);

        return response()->json($group->loadCount(['users as member_count']));
    }

    public function destroy(Request $request, Group $group): JsonResponse
    {
        if (User::where('group_id', $group->id)->exists()) {
            abort(409, 'Group still has assigned users.');
        }

        $name = $group->group_name;
        $group->delete();
        $this->audit->log($request->user(), 'DELETE_GROUP', "Deleted group {$name}", $request);

        return response()->json(null, 204);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'group_name' => ['required', 'string', 'max:255'],
            'room_floor' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'manager_user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);
    }
}
