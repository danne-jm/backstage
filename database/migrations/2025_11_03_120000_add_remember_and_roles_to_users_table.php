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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'remember_token')) {
                // place after password_hash since users table stores password_hash
                $table->rememberToken()->nullable()->after('password_hash');
            }

            if (! Schema::hasColumn('users', 'roles')) {
                // store roles as JSON where supported; fallback to text on older DBs
                try {
                    $table->json('roles')->nullable()->after('remember_token');
                } catch (\Throwable $e) {
                    $table->text('roles')->nullable()->after('remember_token');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'roles')) {
                $table->dropColumn('roles');
            }

            if (Schema::hasColumn('users', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });
    }
};
