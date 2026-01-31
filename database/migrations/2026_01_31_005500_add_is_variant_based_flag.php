<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_variant_based')->default(false)->after('variants_config');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->boolean('is_variant_based')->default(false)->after('variants_config');
        });

        // Backfill: If variants_config is not null, assume it WAS variant based
        // (Assuming standard MySQL/MariaDB JSON behavior or text check)
        DB::statement('UPDATE products SET is_variant_based = 1 WHERE variants_config IS NOT NULL');
        DB::statement('UPDATE events SET is_variant_based = 1 WHERE variants_config IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('is_variant_based');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('is_variant_based');
        });
    }
};
