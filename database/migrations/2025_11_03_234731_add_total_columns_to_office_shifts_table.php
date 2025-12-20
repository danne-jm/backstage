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
            $table->decimal('total_cash', 10, 2)->default(0)->after('start_card')->comment('Start cash + live cash revenue');
            $table->decimal('total_card', 10, 2)->default(0)->after('total_cash')->comment('Start card + live card revenue');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_shifts', function (Blueprint $table) {
            $table->dropColumn(['total_cash', 'total_card']);
        });
    }
};
