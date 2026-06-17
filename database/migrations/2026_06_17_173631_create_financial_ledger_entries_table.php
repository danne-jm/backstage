<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_ledger_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('entry_type'); // sale, refund, fee, payout
            $table->string('direction'); // credit, debit
            $table->decimal('amount', 10, 2);
            $table->string('channel')->nullable(); // online, pos
            $table->string('payment_method')->nullable();
            $table->string('idempotency_key')->unique();
            $table->foreignUlid('transaction_id')->nullable()->constrained('transactions')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_ledger_entries');
    }
};
