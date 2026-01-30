<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (config('database.default') === 'sqlite') {
            return;
        }

        // 1. Restore Product Quantity (Add back POS sales)
        // POS Sales are defined as OfficeShiftSales (since we trust them for details and they caused decrements)
        DB::statement("
            UPDATE products p
            SET quantity = quantity + (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.product_id = p.id
            )
            WHERE quantity IS NOT NULL
        ");

        // 2. Set Product Sold Count (Total Sales = POS + Online)
        // We calculate Fresh Total: OfficeShiftSales + OnlineSales(with transaction)
        DB::statement("
            UPDATE products p
            SET sold_count = (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.product_id = p.id
            ) + (
                SELECT COUNT(*)
                FROM online_sales os
                WHERE os.product_id = p.id
                AND os.online_transaction_id IS NOT NULL
            )
        ");

        // 3. Restore Event Quantity (with_card)
        DB::statement("
            UPDATE events e
            SET quantity_with_card = quantity_with_card + (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.event_id = e.id
                AND JSON_UNQUOTE(JSON_EXTRACT(oss.snapshot, '$.ticket_type')) = 'with_card'
            )
            WHERE quantity_with_card IS NOT NULL
        ");

        // 4. Set Event Sold Count (with_card)
        DB::statement("
            UPDATE events e
            SET sold_count_with_card = (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.event_id = e.id
                AND JSON_UNQUOTE(JSON_EXTRACT(oss.snapshot, '$.ticket_type')) = 'with_card'
            ) + (
                SELECT COUNT(*)
                FROM online_sales os
                WHERE os.event_id = e.id
                AND os.online_transaction_id IS NOT NULL
                AND (os.ticket_type = 'with_card' OR JSON_UNQUOTE(JSON_EXTRACT(os.details, '$.ticket_type')) = 'with_card')
            )
        ");

        // 5. Restore Event Quantity (without_card)
        DB::statement("
            UPDATE events e
            SET quantity_without_card = quantity_without_card + (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.event_id = e.id
                AND JSON_UNQUOTE(JSON_EXTRACT(oss.snapshot, '$.ticket_type')) = 'without_card'
            )
            WHERE quantity_without_card IS NOT NULL
        ");

        // 6. Set Event Sold Count (without_card)
        DB::statement("
            UPDATE events e
            SET sold_count_without_card = (
                SELECT COUNT(*)
                FROM office_shift_sales oss
                WHERE oss.event_id = e.id
                AND JSON_UNQUOTE(JSON_EXTRACT(oss.snapshot, '$.ticket_type')) = 'without_card'
            ) + (
                SELECT COUNT(*)
                FROM online_sales os
                WHERE os.event_id = e.id
                AND os.online_transaction_id IS NOT NULL
                AND (os.ticket_type = 'without_card' OR JSON_UNQUOTE(JSON_EXTRACT(os.details, '$.ticket_type')) = 'without_card')
            )
        ");
    }

    public function down(): void
    {
        // Irreversible fix-forward
    }
};
