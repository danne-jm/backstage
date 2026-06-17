<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('online_sales')) {
            Schema::create('online_sales', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->foreignUlid('product_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignUlid('event_id')->nullable()->constrained()->nullOnDelete();
                $table->string('method')->default('card');
                $table->decimal('amount', 10, 2);
                $table->json('details')->nullable();
                $table->timestamp('sold_at')->useCurrent();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('online_sales');
    }
};
