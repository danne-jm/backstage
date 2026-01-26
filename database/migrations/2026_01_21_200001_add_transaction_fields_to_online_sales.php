<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            if (! Schema::hasColumn('online_sales', 'online_transaction_id')) {
                $table->foreignUlid('online_transaction_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }
            if (! Schema::hasColumn('online_sales', 'reference_id')) {
                $table->string('reference_id', 12)->unique()->nullable()->after('online_transaction_id');
            }
            if (! Schema::hasColumn('online_sales', 'ticket_type')) {
                $table->string('ticket_type')->nullable()->after('details');
            }
        });
    }

    public function down(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            if (Schema::hasColumn('online_sales', 'online_transaction_id')) {
                $table->dropForeign(['online_transaction_id']);
                $table->dropColumn('online_transaction_id');
            }
            if (Schema::hasColumn('online_sales', 'reference_id')) {
                $table->dropColumn('reference_id');
            }
            if (Schema::hasColumn('online_sales', 'ticket_type')) {
                $table->dropColumn('ticket_type');
            }
        });
    }
};
