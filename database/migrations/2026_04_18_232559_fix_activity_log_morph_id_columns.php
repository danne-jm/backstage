<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection(config('activitylog.database_connection'))
            ->table(config('activitylog.table_name'), function (Blueprint $table) {
                $table->string('subject_id', 26)->nullable()->change();
                $table->string('causer_id', 26)->nullable()->change();
            });
    }

    public function down(): void
    {
        Schema::connection(config('activitylog.database_connection'))
            ->table(config('activitylog.table_name'), function (Blueprint $table) {
                $table->unsignedBigInteger('subject_id')->nullable()->change();
                $table->unsignedBigInteger('causer_id')->nullable()->change();
            });
    }
};
