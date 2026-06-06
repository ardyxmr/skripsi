<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
// use GuzzleHttp\Client;

class ProxmoxSyncController extends Controller
{
    public function syncNetworks()
    {
        // TODO: In Phase 4, use Guzzle to hit Proxmox API /api2/json/nodes/{node}/network
        // For now, return mock
        return response()->json(['message' => 'Proxmox networks synchronized (Mock)']);
    }

    public function syncDatastores()
    {
        // TODO: In Phase 4, use Guzzle to hit Proxmox API /api2/json/nodes/{node}/storage
        // For now, return mock
        return response()->json(['message' => 'Proxmox datastores synchronized (Mock)']);
    }
}
