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
        if (Schema::hasTable('event_tickets')) {
            Schema::table('event_tickets', function (Blueprint $table) {
                if (! Schema::hasColumn('event_tickets', 'scan_details')) {
                    $table->json('scan_details')->nullable()->after('scan_count');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('event_tickets')) {
            Schema::table('event_tickets', function (Blueprint $table) {
                if (Schema::hasColumn('event_tickets', 'scan_details')) {
                    $table->dropColumn('scan_details');
                }
            });
        }
    }
};
