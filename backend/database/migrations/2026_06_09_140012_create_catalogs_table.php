<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Published catalog items abstracting one discovered provider template (§3).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalogs', function (Blueprint $table) {
            $table->id();
            $table->string('catalog_name');
            $table->text('catalog_description')->nullable();
            $table->foreignId('provider_id')->constrained('providers')->cascadeOnDelete();
            $table->foreignId('provider_node_id')->nullable()->constrained('provider_nodes')->nullOnDelete();
            $table->foreignId('provider_template_id')->nullable()->constrained('provider_templates')->nullOnDelete();
            $table->string('catalog_image')->nullable();          // path/URL under public/catalog-images
            $table->string('status')->default('Active');          // admin intent: Active | Inactive
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogs');
    }
};
