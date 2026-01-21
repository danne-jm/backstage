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
        if (! Schema::hasTable('event_images')) {
            Schema::create('event_images', function (Blueprint $table) {
                $table->id();
                $table->foreignId('event_id')->constrained()->cascadeOnDelete();
                // Use LONGBLOB for large image data (will receive ALTER below)
                $table->binary('image_data');
                $table->string('mime_type');
                $table->timestamps();
            });
        }

        // Laravel's schema builder might not support 'longBlob' directly via length modifier seamlessly across all drivers in migration DSL,
        // but for MySQL, DB::statement or raw sql is often safer for BLOB sizes if standard methods default to small blob.
        // However, usually $table->binary is blob. To ensure LONGBLOB in MySQL:
        if (config('database.default') === 'mysql') {
            DB::statement('ALTER TABLE event_images CHANGE image_data image_data LONGBLOB');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_images');
    }
};
