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
        Schema::create('sales', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('transaction_id')->constrained('transactions')->cascadeOnDelete();
            $table->ulidMorphs('purchasable'); // purchasable_id, purchasable_type
            $table->foreignUlid('variant_id')->nullable()->constrained('variants')->nullOnDelete();
            $table->decimal('unit_price', 10, 2);
            $table->integer('quantity');
            $table->decimal('subtotal', 10, 2);
            $table->string('ticket_type')->default('regular'); // with_membership, regular
            $table->json('snapshot')->nullable();
            $table->string('discount_code_used')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
