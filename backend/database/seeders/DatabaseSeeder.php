<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\Role;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Bootstrap seed (02-implementation-plan.md Phase 1):
     * 3 roles, "System Administrators" group (manager null), an admin user,
     * then backfill the group's manager — avoids the circular dependency.
     */
    public function run(): void
    {
        $admin = Role::firstOrCreate(['role_name' => 'Administrator'], ['description' => 'Full system access']);
        Role::firstOrCreate(['role_name' => 'Manager'], ['description' => 'Approve/reject/revert requests for the managed group']);
        Role::firstOrCreate(['role_name' => 'User'], ['description' => 'Request and manage own VMs']);

        $group = Group::firstOrCreate(
            ['group_name' => 'System Administrators'],
            ['room_floor' => null, 'description' => 'Bootstrap administrators group', 'manager_user_id' => null]
        );

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@infraprov.local'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('Password123!'),
                'role_id' => $admin->id,
                'group_id' => $group->id,
                'status' => 'Active',
                'auth_provider' => 'local',
            ]
        );

        // Backfill the group manager now that the admin user exists.
        if ($group->manager_user_id === null) {
            $group->update(['manager_user_id' => $adminUser->id]);
        }

        // Authoritative default tiers (architecture-v2). Platinum is admin-creatable.
        foreach ([
            ['Bronze', 2, 4096, 40, 'Small development workload'],
            ['Silver', 4, 8192, 80, 'Medium application workload'],
            ['Gold', 8, 16384, 160, 'Heavy database workload'],
        ] as [$name, $cpu, $ram, $disk, $desc]) {
            Tier::firstOrCreate(
                ['tier_name' => $name],
                ['cpu' => $cpu, 'ram_mb' => $ram, 'disk_gb' => $disk, 'status' => 'Active', 'description' => $desc, 'created_by' => $adminUser->id],
            );
        }
    }
}
