<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->string('name');
                $table->text('description')->nullable();
                $table->decimal('price', 8, 2)->default(0);
                $table->string('type')->default('product'); // 'product' or 'event' or 'membership'
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
