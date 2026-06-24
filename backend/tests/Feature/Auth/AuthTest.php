<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /** The cookie/CSRF SPA login needs a stateful origin (mirrors the browser). */
    private array $statefulOrigin = ['Origin' => 'http://localhost:5173', 'Referer' => 'http://localhost:5173/'];

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $this->admin(['email' => 'admin@test.local']);

        $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => 'admin@test.local', 'password' => 'password'])
            ->assertOk();
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $this->admin(['email' => 'admin@test.local']);

        $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => 'admin@test.local', 'password' => 'nope'])
            ->assertStatus(401);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_authenticated_user_can_read_me(): void
    {
        $admin = $this->admin();

        Sanctum::actingAs($admin);
        $this->getJson('/api/auth/me')->assertOk();
    }

    public function test_failed_login_writes_a_login_failed_audit_row(): void
    {
        $this->admin(['email' => 'admin@test.local']);

        $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => 'admin@test.local', 'password' => 'nope'])
            ->assertStatus(401);

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'LOGIN_FAILED']);
    }

    public function test_login_is_throttled_after_five_failures(): void
    {
        $this->admin(['email' => 'admin@test.local']);

        for ($i = 0; $i < 5; $i++) {
            $this->withHeaders($this->statefulOrigin)
                ->postJson('/api/auth/login', ['email' => 'admin@test.local', 'password' => 'nope'])
                ->assertStatus(401);
        }

        // 6th attempt is locked out (429) and recorded as LOGIN_THROTTLED.
        $this->withHeaders($this->statefulOrigin)
            ->postJson('/api/auth/login', ['email' => 'admin@test.local', 'password' => 'nope'])
            ->assertStatus(429);

        $this->assertDatabaseHas('audit_logs', ['action_type' => 'LOGIN_THROTTLED']);
    }
}
