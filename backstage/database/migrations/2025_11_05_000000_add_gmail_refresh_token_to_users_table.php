<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->text('gmail_refresh_token')->nullable()->after('remember_token');
            $table->string('gmail_provider_id')->nullable()->after('gmail_refresh_token');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $cols = Schema::getColumnListing('users');
            $toDrop = [];
            if (in_array('gmail_refresh_token', $cols)) {
                $toDrop[] = 'gmail_refresh_token';
            }
            if (in_array('gmail_provider_id', $cols)) {
                $toDrop[] = 'gmail_provider_id';
            }
            if (! empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
