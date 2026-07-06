<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Mirror the discovered template's firmware. Provisioning must clone a UEFI/Windows template with
// bios=ovmf; without it Telmate defaults the clone to seabios and a UEFI disk shows "no bootable device".
// Proxmox omits the `bios` line when it is the seabios default, so a null/"seabios" value means legacy BIOS.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('provider_templates', function (Blueprint $table) {
            $table->string('bios')->nullable()->after('template_type');
        });
    }

    public function down(): void
    {
        Schema::table('provider_templates', function (Blueprint $table) {
            $table->dropColumn('bios');
        });
    }
};
