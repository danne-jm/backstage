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
        Schema::create('office_shifts', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignId('started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            // Running totals
            $table->decimal('cash_total', 10, 2)->default(0);
            $table->decimal('card_total', 10, 2)->default(0);

            // Starting amounts
            $table->decimal('start_cash', 10, 2)->default(0);
            $table->decimal('start_card', 10, 2)->default(0);

            // Combined totals (Start + Running)
            $table->decimal('total_cash', 10, 2)->default(0);
            $table->decimal('total_card', 10, 2)->default(0);

            // Breakdowns
            $table->json('start_cash_breakdown')->nullable();
            $table->json('cash_breakdown')->nullable();
            $table->json('end_of_shift_cash_breakdown')->nullable();

            $table->string('status')->default('open');
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        Schema::create('office_shift_workers', function (Blueprint $table) {
            $table->id();
            $table->foreignUlid('office_shift_id')->references('id')->on('office_shifts')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('office_shift_workers');
        Schema::dropIfExists('office_shifts');
    }
};
