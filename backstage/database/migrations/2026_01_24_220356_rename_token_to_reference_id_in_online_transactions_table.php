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
        // Only rename if token column exists (for existing databases)
        // Skip if reference_id already exists (for fresh databases)
        if (Schema::hasColumn('online_transactions', 'token') && ! Schema::hasColumn('online_transactions', 'reference_id')) {
            Schema::table('online_transactions', function (Blueprint $table) {
                $table->renameColumn('token', 'reference_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('online_transactions', 'reference_id') && ! Schema::hasColumn('online_transactions', 'token')) {
            Schema::table('online_transactions', function (Blueprint $table) {
                $table->renameColumn('reference_id', 'token');
            });
        }
    }
};
