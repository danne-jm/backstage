<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->index('start_sell_date');
            $table->index('end_sell_date');
            $table->index('is_online_sellable');
            $table->index('event_date');
            $table->index('responsible_user_id');
        });

        Schema::table('office_shifts', function (Blueprint $table) {
            $table->index('status');
            $table->index('ended_at');
        });

        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('event_id');
            $table->index('office_shift_id');
            $table->index('sold_at');
        });

        Schema::table('online_sales', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('event_id');
            $table->index('online_transaction_id');
            $table->index('sold_at');
        });

        Schema::table('online_transactions', function (Blueprint $table) {
            $table->index('payment_status');
            $table->index('external_payment_id');
        });

        Schema::table('media', function (Blueprint $table) {
            $table->index('collection_name');
        });

        Schema::table('office_shift_workers', function (Blueprint $table) {
            $table->index('office_shift_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex(['start_sell_date']);
            $table->dropIndex(['end_sell_date']);
            $table->dropIndex(['is_online_sellable']);
            $table->dropIndex(['event_date']);
            $table->dropIndex(['responsible_user_id']);
        });

        Schema::table('office_shifts', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropIndex(['ended_at']);
        });

        Schema::table('office_shift_sales', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['event_id']);
            $table->dropIndex(['office_shift_id']);
            $table->dropIndex(['sold_at']);
        });

        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['event_id']);
            $table->dropIndex(['online_transaction_id']);
            $table->dropIndex(['sold_at']);
        });

        Schema::table('online_transactions', function (Blueprint $table) {
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['external_payment_id']);
        });

        Schema::table('media', function (Blueprint $table) {
            $table->dropIndex(['collection_name']);
        });

        Schema::table('office_shift_workers', function (Blueprint $table) {
            $table->dropIndex(['office_shift_id']);
            $table->dropIndex(['user_id']);
        });
    }
};
