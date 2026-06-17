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
            $table->decimal('start_cash', 10, 2)->default(0)->after('status');
            $table->decimal('start_card', 10, 2)->default(0)->after('start_cash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('office_shifts', function (Blueprint $table) {
            $table->dropColumn(['start_cash', 'start_card']);
        });
    }
};
