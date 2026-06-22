<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();

            $table->json('variants_config')->nullable();
            $table->boolean('is_variant_based')->default(false);

            $table->integer('quantity')->nullable();
            $table->boolean('unlimited_quantity')->default(false);
            $table->integer('quantity_with_membership')->nullable();
            $table->integer('quantity_without_membership')->nullable();
            $table->boolean('unlimited_quantity_with_membership')->default(false);
            $table->boolean('unlimited_quantity_without_membership')->default(false);

            $table->boolean('variable_amount')->default(false);
            $table->boolean('is_online_sellable')->default(true);
            $table->boolean('hide_until_sale')->default(false);

            $table->string('instagram_link')->nullable();

            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('price_with_membership', 10, 2)->nullable();
            $table->decimal('price_without_membership', 10, 2)->nullable();
            $table->timestamp('start_sell_date')->nullable();
            $table->timestamp('end_sell_date')->nullable();

            $table->json('responsible_user_ids')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
