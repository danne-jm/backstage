<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Online sales cannot be deleted when an office shift is deleted.
 * They are real revenue records and must be preserved, reverting to orphan status
 * so they can be claimed by the next shift that becomes live.
 *
 * POS sales (office_shift_sales) retain cascadeOnDelete — they are shift-specific records.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
            $table->foreign('office_shift_id')
                ->references('id')
                ->on('office_shifts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
            $table->foreign('office_shift_id')
                ->references('id')
                ->on('office_shifts')
                ->cascadeOnDelete();
        });
    }
};
