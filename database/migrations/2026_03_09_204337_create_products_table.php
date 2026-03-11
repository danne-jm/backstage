<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('variants_config')->nullable();
            $table->boolean('is_variant_based')->default(false);
            $table->decimal('price', 8, 2)->default(0);
            $table->decimal('member_price', 8, 2)->default(0);
            $table->integer('quantity')->nullable();
            $table->integer('sold_count')->default(0);
            $table->boolean('unlimited_quantity')->default(false);
            $table->boolean('variable_amount')->default(false);
            $table->integer('quantity_with_card')->nullable();
            $table->boolean('unlimited_quantity_with_card')->default(false);
            $table->integer('quantity_without_card')->nullable();
            $table->boolean('unlimited_quantity_without_card')->default(false);
            $table->string('type')->nullable();
            $table->boolean('is_online_sellable')->default(false);
            $table->string('instagram_link')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
