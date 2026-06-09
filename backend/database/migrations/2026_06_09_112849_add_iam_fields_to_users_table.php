<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Extend the default users table with IAM fields (06-database-schema.md §1).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->after('password')->constrained('roles')->nullOnDelete();
            $table->foreignId('group_id')->nullable()->after('role_id')->constrained('groups')->nullOnDelete();
            $table->string('status')->default('Active')->after('group_id'); // Active | Inactive
            $table->string('auth_provider')->default('local')->after('status'); // local | ldap | ad | azure (future)
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropConstrainedForeignId('group_id');
            $table->dropColumn(['status', 'auth_provider']);
        });
    }
};
