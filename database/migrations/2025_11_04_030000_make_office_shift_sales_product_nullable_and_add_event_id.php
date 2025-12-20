<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Use raw statements to avoid requiring doctrine/dbal for column modification
        // Only run these raw ALTER statements on databases that support them (not sqlite used in tests)
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            // Drop existing foreign key on product_id, make product_id nullable, re-add FK
            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_product_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` MODIFY `product_id` BIGINT UNSIGNED NULL');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE');

            // Add event_id column and foreign key
            DB::statement('ALTER TABLE `office_shift_sales` ADD COLUMN `event_id` BIGINT UNSIGNED NULL AFTER `product_id`');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE');
        }
    }

    public function down(): void
    {
        // Reverse the changes: drop event fk/column and make product_id NOT NULL again
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_event_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` DROP COLUMN `event_id`');

            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_product_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` MODIFY `product_id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE');
        }
    }
};
