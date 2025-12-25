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
            $table->boolean('unlimited_quantity')->default(false)->after('quantity');
            $table->boolean('unlimited_quantity_with_card')->default(false)->after('quantity_with_card');
            $table->boolean('unlimited_quantity_without_card')->default(false)->after('quantity_without_card');
        });

        // Migrate existing -1 sentinel values to new flags
        \DB::table('events')->where('quantity', -1)->update(['unlimited_quantity' => true, 'quantity' => null]);
        \DB::table('events')->where('quantity_with_card', -1)->update(['unlimited_quantity_with_card' => true, 'quantity_with_card' => null]);
        \DB::table('events')->where('quantity_without_card', -1)->update(['unlimited_quantity_without_card' => true, 'quantity_without_card' => null]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['unlimited_quantity', 'unlimited_quantity_with_card', 'unlimited_quantity_without_card']);
        });
    }
};
