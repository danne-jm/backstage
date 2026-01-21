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
        Schema::table('events', function (Blueprint $table) {
            $table->string('instagram_link')->nullable()->after('google_spreadsheet_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->string('instagram_link')->nullable()->after('is_online_sellable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('instagram_link');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('instagram_link');
        });
    }
};
