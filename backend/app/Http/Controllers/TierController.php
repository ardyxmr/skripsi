<?php

namespace App\Http\Controllers;

use App\Models\Tier;
use Illuminate\Http\Request;

class TierController extends Controller
{
    public function index()
    {
        return Tier::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:tiers',
            'cpu_cores' => 'required|integer',
            'ram_gb' => 'required|integer',
            'disk_gb' => 'required|integer',
        ]);
        return response()->json(Tier::create($validated), 201);
    }

    public function update(Request $request, Tier $tier)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|unique:tiers,name,' . $tier->id,
            'cpu_cores' => 'sometimes|integer',
            'ram_gb' => 'sometimes|integer',
            'disk_gb' => 'sometimes|integer',
        ]);
        $tier->update($validated);
        return response()->json($tier);
    }

    public function destroy(Tier $tier)
    {
        $tier->delete();
        return response()->json(null, 204);
    }
}
