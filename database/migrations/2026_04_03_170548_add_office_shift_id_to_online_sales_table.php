<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->string('office_shift_id', 26)->nullable()->after('online_transaction_id');
            $table->foreign('office_shift_id')->references('id')->on('office_shifts')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('online_sales', function (Blueprint $table) {
            $table->dropForeign(['office_shift_id']);
            $table->dropColumn('office_shift_id');
        });
    }
};
