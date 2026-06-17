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
        Schema::create('transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('channel')->index(); // online, pos
            $table->string('status')->default('pending'); // pending, completed, failed, refunded
            $table->foreignUlid('office_shift_id')->nullable()->constrained('office_shifts')->nullOnDelete();
            $table->string('customer_email')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('discount_total', 10, 2)->default(0);
            $table->string('payment_method'); // sumup_online, pos_card, pos_cash
            $table->string('external_payment_id')->nullable();
            
            // POS Cash specifics
            $table->decimal('cash_tendered_amount', 10, 2)->nullable();
            $table->decimal('cash_change_amount', 10, 2)->nullable();
            $table->json('cash_tendered_breakdown')->nullable();
            $table->json('cash_change_breakdown')->nullable();
            
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
