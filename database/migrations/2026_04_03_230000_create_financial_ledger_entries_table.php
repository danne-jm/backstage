<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('financial_ledger_entries', function (Blueprint $table) {
            $table->ulid('id')->primary();

            $table->string('entry_type')->index();
            $table->string('direction')->default('credit')->index();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('EUR');

            $table->string('channel')->nullable()->index(); // online | office
            $table->string('payment_method')->nullable()->index(); // cash | card | online

            $table->string('source_type')->index();
            $table->string('source_id', 26)->index();
            $table->string('source_reference')->nullable()->index();

            $table->string('idempotency_key')->unique();

            $table->foreignUlid('online_transaction_id')->nullable()->constrained('online_transactions')->nullOnDelete();
            $table->foreignUlid('online_sale_id')->nullable()->constrained('online_sales')->nullOnDelete();
            $table->foreignUlid('office_shift_id')->nullable()->constrained('office_shifts')->nullOnDelete();
            $table->foreignUlid('office_shift_sale_id')->nullable()->constrained('office_shift_sales')->nullOnDelete();
            $table->foreignUlid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->foreignUlid('event_id')->nullable()->constrained('events')->nullOnDelete();

            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_ledger_entries');
    }
};
