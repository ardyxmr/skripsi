<?php

namespace Tests\Feature\Setup;

use App\Models\Role;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    /** The cookie/CSRF SPA login needs a stateful origin (mirrors the browser). */
    private array $statefulOrigin = ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'];

    private array $validPayload = [
        'name' => 'Root Admin',
        'email' => 'root@example.com',
        'password' => 'Sup3rSecret',
        'password_confirmation' => 'Sup3rSecret',
    ];

    public function test_status_reports_needs_setup_on_an_empty_database(): void
    {
        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJson(['needs_setup' => true]);
    }

    public function test_status_reports_installed_once_a_user_exists(): void
    {
        $this->admin();

        $this->getJson('/api/setup/status')
            ->assertOk()
            ->assertJson(['needs_setup' => false]);
    }

    public function test_setup_creates_admin_roles_group_and_tiers(): void
    {
        $this->postJson('/api/setup', $this->validPayload)->assertCreated();

        $admin = User::where('email', 'root@example.com')->firstOrFail();
        $this->assertSame('Administrator', $admin->role->role_name);
        $this->assertSame('System Administrators', $admin->group->group_name);
        // The new admin manages the bootstrap group.
        $this->assertSame($admin->id, $admin->group->manager_user_id);

        $this->assertEqualsCanonicalizing(['Administrator', 'Manager', 'User'], Role::pluck('role_name')->all());
        $this->assertEqualsCanonicalizing(['Bronze', 'Silver', 'Gold'], Tier::pluck('tier_name')->all());
        $this->assertDatabaseHas('audit_logs', ['action_type' => 'SETUP_COMPLETED']);
    }

    public function test_setup_is_locked_once_a_user_exists(): void
    {
        $this->admin(); // app already installed

        $this->postJson('/api/setup', [
            'name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ])->assertStatus(409);

        $this->assertDatabaseMissing('users', ['email' => 'intruder@example.com']);
    }

    public function test_the_new_admin_can_log_in(): void
    {
        $this->postJson('/api/setup', $this->validPayload)->assertCreated();

        $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => 'root@example.com', 'password' => 'Sup3rSecret'])
            ->assertOk()
            ->assertJson(['email' => 'root@example.com', 'role' => 'Administrator']);
    }

    public function test_setup_rejects_a_weak_password(): void
    {
        $this->postJson('/api/setup', [
            'name' => 'Root Admin',
            'email' => 'root@example.com',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['password']]]);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_setup_rejects_a_password_mismatch(): void
    {
        $this->postJson('/api/setup', [
            'name' => 'Root Admin',
            'email' => 'root@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Different123',
        ])->assertStatus(422)->assertJsonStructure(['error' => ['details' => ['password']]]);

        $this->assertDatabaseCount('users', 0);
    }
}
