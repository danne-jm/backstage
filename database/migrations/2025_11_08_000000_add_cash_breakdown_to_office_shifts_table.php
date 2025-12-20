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
        Schema::table('office_shifts', function (Blueprint $table) {
            // JSON columns to store denomination counts for start-of-shift and current cashbox
            $table->json('start_cash_breakdown')->nullable()->after('start_cash');
            $table->json('cash_breakdown')->nullable()->after('cash_total');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_shifts', function (Blueprint $table) {
            $table->dropColumn(['start_cash_breakdown', 'cash_breakdown']);
        });
    }
};
