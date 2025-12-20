<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (! Schema::hasColumn('products', 'quantity')) {
                    $table->integer('quantity')->nullable()->after('price');
                }
                if (! Schema::hasColumn('products', 'variable_amount')) {
                    $table->boolean('variable_amount')->default(false)->after('quantity');
                }
                if (! Schema::hasColumn('products', 'quantity_with_card')) {
                    $table->integer('quantity_with_card')->nullable()->after('variable_amount');
                }
                if (! Schema::hasColumn('products', 'quantity_without_card')) {
                    $table->integer('quantity_without_card')->nullable()->after('quantity_with_card');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'quantity_without_card')) {
                    $table->dropColumn('quantity_without_card');
                }
                if (Schema::hasColumn('products', 'quantity_with_card')) {
                    $table->dropColumn('quantity_with_card');
                }
                if (Schema::hasColumn('products', 'variable_amount')) {
                    $table->dropColumn('variable_amount');
                }
                if (Schema::hasColumn('products', 'quantity')) {
                    $table->dropColumn('quantity');
                }
            });
        }
    }
};
