<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Per-environment data-disk policy cap (ADR-16/18). Soft governance ceiling that sits UNDER the
// physical stub ceiling (config provisioning.max_data_disk_slots). Defaults to that ceiling so the
// migration never tightens existing environments; admins lower it per env (e.g. Development = 2).
return new class extends Migration
{
    public function up(): void
    {
        $ceiling = (int) config('provisioning.max_data_disk_slots', 6);

        Schema::table('environments', function (Blueprint $table) use ($ceiling) {
            $table->integer('max_data_disks')->default($ceiling)->after('allow_data_disk');
        });
    }

    public function down(): void
    {
        Schema::table('environments', function (Blueprint $table) {
            $table->dropColumn('max_data_disks');
        });
    }
};
