<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-VM login credentials. The password is generated per VM at provision time and stored ENCRYPTED
// (Inventory model `encrypted` cast); it is never returned in the inventory list — only via the
// audited GET /inventory/{id}/credentials reveal endpoint. Replaces the shared ChangeMe123! default.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->string('login_username')->nullable()->after('vm_name');
            $table->text('login_password')->nullable()->after('login_username'); // encrypted at rest
        });
    }

    public function down(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropColumn(['login_username', 'login_password']);
        });
    }
};
