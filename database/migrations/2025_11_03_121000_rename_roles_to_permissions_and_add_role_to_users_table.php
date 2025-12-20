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
            // Add permissions column if it doesn't exist
            if (! Schema::hasColumn('users', 'permissions')) {
                try {
                    $table->json('permissions')->nullable()->after('remember_token');
                } catch (\Throwable $e) {
                    $table->text('permissions')->nullable()->after('remember_token');
                }
            }

            // Add role column if it doesn't exist
            if (! Schema::hasColumn('users', 'role')) {
                $table->string('role')->nullable()->after('permissions');
            }
        });

        // Copy existing roles -> permissions if roles column exists
        if (Schema::hasColumn('users', 'roles') && ! Schema::hasColumn('users', 'permissions')) {
            // This case is unlikely because we created permissions above, but guard anyway
        }

        if (Schema::hasColumn('users', 'roles') && Schema::hasColumn('users', 'permissions')) {
            try {
                DB::statement('UPDATE users SET permissions = roles WHERE roles IS NOT NULL');
            } catch (\Throwable $e) {
                // ignore copy failure
            }

            // drop old roles column if present
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'roles')) {
                    $table->dropColumn('roles');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Try to restore roles from permissions and drop permissions + role
        if (Schema::hasColumn('users', 'permissions')) {
            try {
                DB::statement('UPDATE users SET roles = permissions WHERE permissions IS NOT NULL');
            } catch (\Throwable $e) {
                // ignore
            }
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'permissions')) {
                $table->dropColumn('permissions');
            }

            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
        });
    }
};
