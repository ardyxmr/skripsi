<?php

namespace App\Http\Controllers;

use App\Models\VmsInventory;
use Illuminate\Http\Request;

class VmInventoryController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        if ($user->hasRole('Admin')) {
             return VmsInventory::with(['user', 'group'])->get();
        }
        return VmsInventory::where('user_id', $user->id)->get();
    }

    public function action(Request $request, VmsInventory $vm)
    {
        $validated = $request->validate([
            'action' => 'required|in:start,stop,restart'
        ]);

        // Security check
        if ($request->user()->id !== $vm->user_id && !$request->user()->hasRole('Admin')) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // TODO: In Phase 4, we will call Proxmox API via Guzzle here to execute the action.
        
        return response()->json(['message' => "VM action {$validated['action']} initiated"]);
    }
}
