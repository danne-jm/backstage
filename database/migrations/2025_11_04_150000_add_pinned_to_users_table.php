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
            // nullable JSON column to store user-pinned footer items
            $table->json('pinned')->nullable()->after('permissions');
        });

        // Set a sensible default for existing users
        $default = json_encode([
            ['title' => 'Gmail', 'href' => 'https://mail.google.com/', 'icon' => 'Mails'],
            ['title' => 'Google Drive', 'href' => 'https://drive.google.com/', 'icon' => 'Container'],
            ['title' => 'ESN Leuven Website', 'href' => 'https://www.esnleuven.be/', 'icon' => 'Globe'],
            ['title' => 'ESN Leuven Store', 'href' => 'https://esn-leuven.sumupstore.com/', 'icon' => 'ShoppingBag'],
        ]);

        DB::table('users')->update(['pinned' => $default]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('pinned');
        });
    }
};
