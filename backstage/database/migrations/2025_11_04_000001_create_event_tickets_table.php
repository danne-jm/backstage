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
        // Make migration safe to run when the table already exists (useful for dev environments)
        if (! Schema::hasTable('event_tickets')) {
            // Create the table on the 'tickets' connection and avoid cross-connection FKs
            Schema::create('event_tickets', function (Blueprint $table) {
                $table->ulid('id')->primary();
                // store event_id as a plain nullable unsignedBigInteger; do not add a FK
                $table->unsignedBigInteger('event_id')->nullable();
                $table->string('first_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('email')->nullable();
                $table->string('event_name')->nullable();
                $table->dateTime('event_date')->nullable();
                $table->string('unique_trait')->nullable();
                $table->string('ticket_id')->unique();
                $table->timestamps();

                $table->index(['event_id']);
                $table->index(['ticket_id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_tickets');
    }
};
