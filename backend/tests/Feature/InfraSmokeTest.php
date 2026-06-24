<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Proves the test harness: Postgres test DB migrates cleanly and the app boots. */
class InfraSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_runs_against_the_postgres_test_database(): void
    {
        $this->assertSame('infraprov_test', \DB::connection()->getDatabaseName());
        $this->assertSame('pgsql', \DB::connection()->getDriverName());
    }

    public function test_health_endpoint_responds(): void
    {
        $this->getJson('/api/health')->assertOk();
    }
}
