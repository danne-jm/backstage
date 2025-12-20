<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('office_shift_sales')) {
            Schema::table('office_shift_sales', function (Blueprint $table) {
                if (! Schema::hasColumn('office_shift_sales', 'snapshot')) {
                    // store a JSON snapshot of non-price fields for easy updates
                    $table->json('snapshot')->nullable()->after('description');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('office_shift_sales')) {
            Schema::table('office_shift_sales', function (Blueprint $table) {
                if (Schema::hasColumn('office_shift_sales', 'snapshot')) {
                    $table->dropColumn('snapshot');
                }
            });
        }
    }
};
