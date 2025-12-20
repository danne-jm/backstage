<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('office_shifts') && ! Schema::hasColumn('office_shifts', 'workers')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->json('workers')->nullable()->after('notes');
            });
        }

        if (Schema::hasTable('office_shifts') && ! Schema::hasColumn('office_shifts', 'sales')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->json('sales')->nullable()->after('workers');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('office_shifts') && Schema::hasColumn('office_shifts', 'sales')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->dropColumn('sales');
            });
        }

        if (Schema::hasTable('office_shifts') && Schema::hasColumn('office_shifts', 'workers')) {
            Schema::table('office_shifts', function (Blueprint $table) {
                $table->dropColumn('workers');
            });
        }
    }
};
