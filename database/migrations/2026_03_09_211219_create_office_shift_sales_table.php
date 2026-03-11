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
        Schema::create('office_shift_sales', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('product_id')->nullable();
            $table->foreignId('event_id')->nullable();
            $table->foreignUlid('office_shift_id')->nullable();
            $table->string('method')->nullable();
            $table->decimal('amount', 8, 2)->default(0);
            $table->string('description')->nullable();
            $table->json('snapshot')->nullable();
            $table->json('breakdown')->nullable();
            $table->foreignId('sold_by')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('office_shift_sales');
    }
};
