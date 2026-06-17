<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::table('office_shift_sales', function ($table) {
                // SQLite ALTER constraints are limited, but we can add columns and nullable.
                // product_id nullable change in sqlite requires recreating table usually,
                // but we can try just adding event_id first.
                // Making product_id nullable in SQLite simple usage:
                $table->ulid('product_id')->nullable()->change();
                $table->foreignUlid('event_id')->nullable()->after('product_id')->constrained('events')->cascadeOnDelete();
            });
        } else {
            // Drop existing foreign key on product_id, make product_id nullable, re-add FK
            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_product_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` MODIFY `product_id` CHAR(26) NULL');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE');

            // Add event_id column and foreign key
            DB::statement('ALTER TABLE `office_shift_sales` ADD COLUMN `event_id` CHAR(26) NULL AFTER `product_id`');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            Schema::table('office_shift_sales', function ($table) {
                // Reverting in SQLite is hard (dropping column allowed in newer versions)
                $table->dropColumn('event_id');
                // Cannot easily revert nullable change without table recreation
            });
        } else {
            // Reverse the changes: drop event fk/column and make product_id NOT NULL again
            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_event_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` DROP COLUMN `event_id`');

            DB::statement('ALTER TABLE `office_shift_sales` DROP FOREIGN KEY `office_shift_sales_product_id_foreign`');
            DB::statement('ALTER TABLE `office_shift_sales` MODIFY `product_id` BIGINT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE `office_shift_sales` ADD CONSTRAINT `office_shift_sales_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE');
        }
    }
};
