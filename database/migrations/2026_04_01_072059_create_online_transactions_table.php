<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_transactions', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('reference_id', 64)->unique();
            $table->decimal('total_amount', 10, 2);
            $table->decimal('processing_fee', 10, 2)->default(0);
            $table->json('discount_codes')->nullable();
            $table->string('external_payment_id')->nullable();
            $table->enum('payment_status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_gateway')->default('development');
            $table->string('email');
            $table->timestamp('completed_at')->nullable();
            $table->boolean('mail_success')->default(false);
            $table->timestamps();
        });

        // Add foreign key to online_sales if the table already exists
        if (Schema::hasTable('online_sales') && Schema::hasColumn('online_sales', 'online_transaction_id')) {
            Schema::table('online_sales', function (Blueprint $table) {
                $table->foreign('online_transaction_id')
                    ->references('id')
                    ->on('online_transactions')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('online_sales')) {
            Schema::table('online_sales', function (Blueprint $table) {
                $table->dropForeignIfExists(['online_transaction_id']);
            });
        }

        Schema::dropIfExists('online_transactions');
    }
};
