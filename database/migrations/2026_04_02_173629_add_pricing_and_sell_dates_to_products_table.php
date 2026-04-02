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
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('price_with_card', 8, 2)->nullable()->after('member_price');
            $table->decimal('price_without_card', 8, 2)->nullable()->after('price_with_card');
            $table->timestamp('start_sell_date')->nullable()->after('price_without_card');
            $table->timestamp('end_sell_date')->nullable()->after('start_sell_date');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['price_with_card', 'price_without_card', 'start_sell_date', 'end_sell_date']);
        });
    }
};
