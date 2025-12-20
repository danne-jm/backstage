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
                if (! Schema::hasColumn('office_shift_sales', 'sold_at')) {
                    $table->timestamp('sold_at')->nullable()->after('sold_by');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('office_shift_sales')) {
            Schema::table('office_shift_sales', function (Blueprint $table) {
                if (Schema::hasColumn('office_shift_sales', 'sold_at')) {
                    $table->dropColumn('sold_at');
                }
            });
        }
    }
};
