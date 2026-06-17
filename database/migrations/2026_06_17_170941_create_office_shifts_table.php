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
        Schema::create('office_shifts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('started_by')->constrained('users');
            $table->foreignUlid('ended_by')->nullable()->constrained('users');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->string('status')->default('open'); // open, closed
            $table->json('start_cash_breakdown')->nullable();
            $table->decimal('expected_cash_total', 10, 2)->default(0);
            $table->json('end_of_shift_cash_breakdown')->nullable();
            $table->decimal('discrepancy_amount', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('office_shifts');
    }
};
