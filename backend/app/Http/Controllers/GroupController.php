<?php

namespace App\Http\Controllers;

use App\Models\Group;
use Illuminate\Http\Request;

class GroupController extends Controller
{
    public function index()
    {
        return Group::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:groups',
            'description' => 'nullable|string',
            'quota_vms' => 'required|integer',
            'quota_cpu' => 'required|integer',
            'quota_ram' => 'required|integer',
        ]);
        return response()->json(Group::create($validated), 201);
    }

    public function show(Group $group)
    {
        return $group->load('users');
    }

    public function update(Request $request, Group $group)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:groups,name,' . $group->id,
            'description' => 'nullable|string',
            'quota_vms' => 'sometimes|integer',
            'quota_cpu' => 'sometimes|integer',
            'quota_ram' => 'sometimes|integer',
        ]);
        $group->update($validated);
        return response()->json($group);
    }

    public function destroy(Group $group)
    {
        $group->delete();
        return response()->json(null, 204);
    }
}
