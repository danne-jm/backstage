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
            $table->foreignUlid('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->foreignUlid('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->ulidMorphs('purchasable');
            $table->decimal('original_amount', 10, 2);
            $table->decimal('paid_amount', 10, 2);
            $table->decimal('saved_amount', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_usages');
    }
};
