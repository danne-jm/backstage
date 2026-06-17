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
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulidMorphs('purchasable'); // purchasable_id, purchasable_type
            $table->foreignUlid('variant_id')->nullable()->constrained('variants')->nullOnDelete();
            $table->foreignUlid('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->string('type'); // sale, restock, adjustment, refund
            $table->integer('quantity'); // negative for sale/reduction, positive for restock/addition
            $table->string('ticket_type')->nullable(); // 'with_membership', 'regular', etc. for split pools
            $table->text('notes')->nullable();
            $table->timestamps();
            
            // Index for fast SUM queries
            $table->index(['purchasable_type', 'purchasable_id', 'variant_id', 'ticket_type'], 'inv_mov_purchasable_variant_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
