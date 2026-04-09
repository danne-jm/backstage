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
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['online_transaction_id']);

            $table->foreign('online_transaction_id')
                ->references('id')
                ->on('online_transactions')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['online_transaction_id']);

            $table->foreign('online_transaction_id')
                ->references('id')
                ->on('online_transactions')
                ->nullOnDelete();
        });
    }
};
