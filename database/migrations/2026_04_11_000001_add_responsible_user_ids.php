<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->json('responsible_user_ids')->nullable()->after('responsible_user_id');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->json('responsible_user_ids')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('responsible_user_ids');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('responsible_user_ids');
        });
    }
};
