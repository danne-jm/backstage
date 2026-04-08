<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ensures all sales associated with an office shift are deleted when the shift is deleted.
 *
 * - office_shift_sales.office_shift_id: was missing a FK constraint entirely — adds one with cascadeOnDelete.
 * - online_sales.office_shift_id: was nullOnDelete — changes to cascadeOnDelete so that online sales
 *   assigned to a shift are removed alongside it (consistent with POS sale behaviour).
 */
return new class extends Migration {
    public function up(): void
    {
        // 1. Add the missing FK + cascade on office_shift_sales
        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->foreign('office_shift_id')
                ->references('id')
                ->on('office_shifts')
                ->cascadeOnDelete();
        });

        // 2. Re-wire online_sales FK from nullOnDelete → cascadeOnDelete
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
            $table->foreign('office_shift_id')
                ->references('id')
                ->on('office_shifts')
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
            $table->foreign('office_shift_id')
                ->references('id')
                ->on('office_shifts')
                ->nullOnDelete();
        });

        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
        });
    }
};
