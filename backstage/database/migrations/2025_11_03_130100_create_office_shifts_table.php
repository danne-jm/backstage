<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('office_shifts')) {
            Schema::create('office_shifts', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->foreignUlid('started_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('started_at')->nullable();
                $table->timestamp('ended_at')->nullable();
                $table->decimal('cash_total', 10, 2)->default(0);
                $table->decimal('card_total', 10, 2)->default(0);
                $table->string('status')->default('open');
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('office_shifts');
    }
};
