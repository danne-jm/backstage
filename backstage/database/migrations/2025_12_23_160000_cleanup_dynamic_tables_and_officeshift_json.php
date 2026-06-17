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
        // Remove workers and sales columns from office_shifts if they exist
        if (Schema::hasColumn('office_shifts', 'workers')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->dropColumn('workers');
            });
        }
        if (Schema::hasColumn('office_shifts', 'sales')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->dropColumn('sales');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: cannot restore dropped dynamic tables or columns
    }
};
