<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_sellables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('original_type'); // 'product' or 'event'
            $table->unsignedBigInteger('original_id');
            $table->string('name')->nullable();
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->date('event_date')->nullable();
            $table->integer('remaining')->nullable();
            $table->json('metadata')->nullable();
            $table->json('images')->nullable(); // array of stored image paths
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_sellables');
    }
};
