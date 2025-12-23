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
            $table->json('end_of_shift_cash_breakdown')->nullable()->after('cash_breakdown');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_shifts', function (Blueprint $table) {
            $table->dropColumn('end_of_shift_cash_breakdown');
        });
    }
};