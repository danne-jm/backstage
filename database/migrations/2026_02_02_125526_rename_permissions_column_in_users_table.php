<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('legacy_permissions')->nullable();
        });

        // Copy data if table exists and has permissions column
        if (Schema::hasColumn('users', 'permissions')) {
            DB::statement('UPDATE users SET legacy_permissions = permissions');
        }

        if (Schema::hasColumn('users', 'permissions')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('permissions');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('permissions')->nullable();
        });

        if (Schema::hasColumn('users', 'legacy_permissions')) {
            DB::statement('UPDATE users SET permissions = legacy_permissions');
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'legacy_permissions')) {
                $table->dropColumn('legacy_permissions');
            }
        });
    }
};
