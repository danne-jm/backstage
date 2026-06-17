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
            // remember_token (used by SessionGuard)
            if (! Schema::hasColumn('users', 'remember_token')) {
                // place after password_hash since users table stores password_hash
                $table->rememberToken()->nullable()->after('password_hash');
            }

            // Gmail OAuth columns used by the app
            if (! Schema::hasColumn('users', 'gmail_provider_id')) {
                $table->string('gmail_provider_id')->nullable()->after('remember_token');
            }

            if (! Schema::hasColumn('users', 'gmail_provider_email')) {
                $table->string('gmail_provider_email')->nullable()->after('gmail_provider_id');
            }

            if (! Schema::hasColumn('users', 'gmail_refresh_token')) {
                $table->text('gmail_refresh_token')->nullable()->after('gmail_provider_email');
            }
        });

        // Populate existing rows: set gmail_provider_email = email for rows that don't have it
        // This helps the settings UI show a connected email for existing users (if they previously used email field)
        DB::table('users')->whereNull('gmail_provider_email')->update([
            'gmail_provider_email' => DB::raw('email'),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop columns if they exist
            if (Schema::hasColumn('users', 'gmail_refresh_token')) {
                $table->dropColumn('gmail_refresh_token');
            }

            if (Schema::hasColumn('users', 'gmail_provider_email')) {
                $table->dropColumn('gmail_provider_email');
            }

            if (Schema::hasColumn('users', 'gmail_provider_id')) {
                $table->dropColumn('gmail_provider_id');
            }

            if (Schema::hasColumn('users', 'remember_token')) {
                $table->dropColumn('remember_token');
            }
        });
    }
};
