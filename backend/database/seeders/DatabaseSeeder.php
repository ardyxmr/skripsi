<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Tier;
// use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        // uncomment these when spatie is installed
        // $adminRole = Role::create(['name' => 'Admin']);
        // $managerRole = Role::create(['name' => 'Manager']);
        // $userRole = Role::create(['name' => 'User']);

        $admin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@infraprov.local',
            'password' => Hash::make('P@ssw0rd'),
        ]);
        
        // $admin->assignRole($adminRole);

        // Default Tiers
        Tier::create(['name' => 'Bronze', 'cpu_cores' => 1, 'ram_gb' => 1, 'disk_gb' => 20]);
        Tier::create(['name' => 'Silver', 'cpu_cores' => 2, 'ram_gb' => 4, 'disk_gb' => 50]);
        Tier::create(['name' => 'Gold',   'cpu_cores' => 4, 'ram_gb' => 8, 'disk_gb' => 100]);
    }
}
