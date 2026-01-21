<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('product_images')) {
            Schema::create('product_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained()->cascadeOnDelete();
                $table->binary('image_data');
                $table->string('mime_type');
                $table->timestamps();
            });
        }

        // Upgrade to LONGBLOB for MySQL
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE product_images CHANGE image_data image_data LONGBLOB');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_images');
    }
};
