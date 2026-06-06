<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('datastores', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('storage_id')->unique();
            $table->string('type')->default('lvm-thin');
            $table->integer('capacity_gb')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('datastores');
    }
};
