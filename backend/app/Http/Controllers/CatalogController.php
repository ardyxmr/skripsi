<?php

namespace App\Http\Controllers;

use App\Models\Catalog;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index()
    {
        return Catalog::where('is_active', true)->get();
    }

    public function indexAdmin()
    {
        return Catalog::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'os_name' => 'required|string',
            'template_id' => 'required|integer|unique:catalogs',
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);
        return response()->json(Catalog::create($validated), 201);
    }

    public function show(Catalog $catalog)
    {
        return $catalog;
    }

    public function update(Request $request, Catalog $catalog)
    {
        $validated = $request->validate([
            'os_name' => 'sometimes|string',
            'template_id' => 'sometimes|integer|unique:catalogs,template_id,' . $catalog->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean'
        ]);
        $catalog->update($validated);
        return response()->json($catalog);
    }

    public function destroy(Catalog $catalog)
    {
        $catalog->delete();
        return response()->json(null, 204);
    }
}
