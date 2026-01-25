<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * SECURITY FIX: Add sold_count columns for atomic inventory tracking.
     * This prevents overselling via snapshot isolation during concurrent transactions.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->unsignedInteger('sold_count_with_card')->default(0)->after('quantity_with_card');
            $table->unsignedInteger('sold_count_without_card')->default(0)->after('quantity_without_card');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('sold_count')->default(0)->after('quantity');
        });

        // Backfill existing sold counts from sales tables
        // NOTE: Skip backfill on SQLite (test environment) since JSON functions differ
        if (config('database.default') !== 'sqlite') {
            // Events - with_card
            \DB::statement("
                UPDATE events SET sold_count_with_card = (
                    SELECT COALESCE(
                        (SELECT COUNT(*) FROM office_shift_sales WHERE office_shift_sales.event_id = events.id AND JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.ticket_type')) = 'with_card'), 0
                    ) + COALESCE(
                        (SELECT COUNT(*) FROM online_sales WHERE online_sales.event_id = events.id AND JSON_UNQUOTE(JSON_EXTRACT(details, '$.ticket_type')) = 'with_card'), 0
                    )
                )
            ");

            // Events - without_card
            \DB::statement("
                UPDATE events SET sold_count_without_card = (
                    SELECT COALESCE(
                        (SELECT COUNT(*) FROM office_shift_sales WHERE office_shift_sales.event_id = events.id AND JSON_UNQUOTE(JSON_EXTRACT(snapshot, '$.ticket_type')) = 'without_card'), 0
                    ) + COALESCE(
                        (SELECT COUNT(*) FROM online_sales WHERE online_sales.event_id = events.id AND JSON_UNQUOTE(JSON_EXTRACT(details, '$.ticket_type')) = 'without_card'), 0
                    )
                )
            ");

            // Products
            \DB::statement('
                UPDATE products SET sold_count = (
                    SELECT COALESCE(
                        (SELECT COUNT(*) FROM office_shift_sales WHERE office_shift_sales.product_id = products.id), 0
                    ) + COALESCE(
                        (SELECT COUNT(*) FROM online_sales WHERE online_sales.product_id = products.id), 0
                    )
                )
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['sold_count_with_card', 'sold_count_without_card']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('sold_count');
        });
    }
};
