<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('tiers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('cpu_cores');
            $table->integer('ram_gb');
            $table->integer('disk_gb');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('tiers');
    }
};
