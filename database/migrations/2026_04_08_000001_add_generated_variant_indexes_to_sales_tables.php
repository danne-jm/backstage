<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Generated columns with JSON_UNQUOTE are MySQL/MariaDB-only.
        // SQLite (used in tests) does not support them, so we skip on that driver.
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->string('snapshot_variant_id', 26)
                ->storedAs("JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.variant_id'))")
                ->nullable()
                ->index('idx_office_shift_sales_variant_id');
        });

        Schema::table('online_sales', function (Blueprint $table) {
            $table->string('details_variant_id', 26)
                ->storedAs("JSON_UNQUOTE(JSON_EXTRACT(details, '$.variant_id'))")
                ->nullable()
                ->index('idx_online_sales_variant_id');
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->dropIndex('idx_office_shift_sales_variant_id');
            $table->dropColumn('snapshot_variant_id');
        });

        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropIndex('idx_online_sales_variant_id');
            $table->dropColumn('details_variant_id');
        });
    }
};
