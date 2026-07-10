<?php

namespace Tests;

use App\Models\Group;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    private ?Group $sharedTestGroup = null;

    /** Idempotently ensure a role exists, return it. */
    protected function role(string $name): Role
    {
        return Role::firstOrCreate(['role_name' => $name], ['description' => $name]);
    }

    /**
     * A shared "team" group for the default fixtures: regularUser() joins it, manager() manages it.
     * This models the RBAC scoping (Manager sees/acts on the members of groups they manage).
     */
    protected function defaultGroup(): Group
    {
        return $this->sharedTestGroup ??= Group::create(['group_name' => 'Team '.Str::random(6)]);
    }

    /**
     * Create an Active user with the given role. Password is always 'password'
     * (the model's `hashed` cast hashes it on write).
     */
    protected function makeUser(string $roleName = 'User', array $attrs = []): User
    {
        // Name is unique (case-insensitive) per the 2026-06-18 functional index, so
        // making two users of the same role in one test must not collide on name.
        return User::create(array_merge([
            'name' => $roleName.' Tester '.Str::random(6),
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
            'role_id' => $this->role($roleName)->id,
            'status' => 'Active',
        ], $attrs));
    }

    protected function admin(array $attrs = []): User
    {
        return $this->makeUser('Administrator', $attrs);
    }

    protected function manager(array $attrs = []): User
    {
        $manager = $this->makeUser('Manager', $attrs);
        // By default a manager manages the shared team group, so it can act on that team's requests.
        if (! array_key_exists('group_id', $attrs)) {
            $this->defaultGroup()->update(['manager_user_id' => $manager->id]);
        }

        return $manager;
    }

    protected function regularUser(array $attrs = []): User
    {
        return $this->makeUser('User', array_merge(['group_id' => $this->defaultGroup()->id], $attrs));
    }
}
