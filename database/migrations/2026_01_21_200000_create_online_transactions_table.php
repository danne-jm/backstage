<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('online_transactions')) {
            Schema::create('online_transactions', function (Blueprint $table) {
                $table->ulid('id')->primary();
                $table->decimal('total_amount', 10, 2);
                $table->decimal('processing_fee', 10, 2)->default(0);
                $table->json('discount_codes')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('online_transactions');
    }
};
