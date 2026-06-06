<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('vm_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('group_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('catalog_id')->constrained()->onDelete('cascade');
            $table->foreignId('tier_id')->constrained()->onDelete('cascade');
            $table->string('vm_name');
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->string('approval_status')->default('pending'); // pending, approved, rejected
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('vm_requests');
    }
};
