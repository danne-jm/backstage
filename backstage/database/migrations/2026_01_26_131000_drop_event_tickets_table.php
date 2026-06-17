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
        Schema::dropIfExists('event_tickets');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('event_tickets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->timestamps();
            // Note: We don't need to fully restore the schema for a 'down' on a drop,
            // but normally we would. For this task, avoiding complexity is fine unless requested.
        });
    }
};
