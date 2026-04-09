<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('sold_count');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['sold_count_with_card', 'sold_count_without_card']);
        });

        Schema::table('sellable_variants', function (Blueprint $table) {
            $table->dropColumn('sold_count');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->integer('sold_count')->default(0);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->integer('sold_count_with_card')->default(0);
            $table->integer('sold_count_without_card')->default(0);
        });

        Schema::table('sellable_variants', function (Blueprint $table) {
            $table->integer('sold_count')->default(0);
        });
    }
};
