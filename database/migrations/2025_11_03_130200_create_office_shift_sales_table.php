<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('office_shift_sales')) {
            Schema::create('office_shift_sales', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->foreignUlid('office_shift_id')->constrained('office_shifts')->cascadeOnDelete();
                $table->foreignUlid('product_id')->constrained('products')->cascadeOnDelete();
                $table->string('method')->default('card'); // card or cash
                $table->decimal('amount', 10, 2)->default(0);
                $table->text('description')->nullable();
                $table->foreignUlid('sold_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('office_shift_sales');
    }
};
