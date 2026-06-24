<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Roles carry a permissions list (displayed in the UI; RBAC gating still uses
// role_name). Defaults seeded for the three bootstrap roles.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->json('permissions')->nullable()->after('description');
        });

        $defaults = [
            'Administrator' => ['Provision VM', 'Inventory', 'Approval', 'Settings'],
            'Manager' => ['Provision VM', 'Inventory', 'Approval'],
            'User' => ['Provision VM', 'Inventory'],
        ];
        foreach ($defaults as $name => $perms) {
            DB::table('roles')->where('role_name', $name)->update(['permissions' => json_encode($perms)]);
        }
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('permissions');
        });
    }
};
