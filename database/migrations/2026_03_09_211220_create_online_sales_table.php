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
        Schema::create('online_sales', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('reference_id')->nullable();
            $table->foreignUlid('online_transaction_id')->nullable();
            $table->foreignUlid('product_id')->nullable();
            $table->foreignUlid('event_id')->nullable();
            $table->string('method')->nullable();
            $table->decimal('amount', 8, 2)->default(0);
            $table->json('details')->nullable();
            $table->string('ticket_type')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('online_sales');
    }
};
