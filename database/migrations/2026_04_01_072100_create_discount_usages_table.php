<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_usages', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('code');
            $table->ulid('online_transaction_id');
            $table->ulid('online_sale_id')->nullable();
            $table->string('product_id')->nullable();
            $table->string('event_id')->nullable();
            $table->decimal('original_price', 10, 2)->default(0);
            $table->decimal('paid_price', 10, 2)->default(0);
            $table->decimal('saved_amount', 10, 2)->default(0);
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->foreign('online_transaction_id')
                ->references('id')
                ->on('online_transactions')
                ->cascadeOnDelete();

            $table->index('code');
            $table->index(['code', 'product_id']);
            $table->index(['code', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_usages');
    }
};
