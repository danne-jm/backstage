<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->boolean('hide_until_sale')->default(false)->after('is_online_sellable');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->boolean('hide_until_sale')->default(false)->after('is_online_sellable');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('hide_until_sale');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('hide_until_sale');
        });
    }
};
