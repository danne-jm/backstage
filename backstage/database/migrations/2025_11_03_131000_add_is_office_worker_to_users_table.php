<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'is_office_worker')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_office_worker')->default(false)->after('role');
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_office_worker')) {
                $table->dropColumn('is_office_worker');
            }
        });
    }
};
