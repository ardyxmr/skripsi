<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_only_endpoint_rejects_regular_user(): void
    {
        Sanctum::actingAs($this->regularUser());
        $this->getJson('/api/users')->assertStatus(403);
    }

    public function test_admin_only_endpoint_rejects_manager(): void
    {
        Sanctum::actingAs($this->manager());
        $this->getJson('/api/users')->assertStatus(403);
    }

    public function test_admin_can_list_users(): void
    {
        Sanctum::actingAs($this->admin());
        $this->getJson('/api/users')->assertOk();
    }

    public function test_non_admin_cannot_create_a_tier(): void
    {
        Sanctum::actingAs($this->regularUser());
        // 403 from the role gate fires before any body validation.
        $this->postJson('/api/tiers', ['tier_name' => 'X', 'cpu' => 2, 'ram_mb' => 2048, 'disk_gb' => 20])
            ->assertStatus(403);
    }

    public function test_any_authenticated_user_can_read_tiers_but_anon_cannot(): void
    {
        $this->getJson('/api/tiers')->assertStatus(401);

        Sanctum::actingAs($this->regularUser());
        $this->getJson('/api/tiers')->assertOk();
    }
}
