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
        Schema::table('online_transactions', function (Blueprint $table) {
            $table->string('external_payment_id')->nullable()->after('discount_codes');
            $table->string('payment_status')->default('pending')->after('external_payment_id');
            $table->string('payment_gateway')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('online_transactions', function (Blueprint $table) {
            $table->dropColumn(['external_payment_id', 'payment_status', 'payment_gateway']);
        });
    }
};
