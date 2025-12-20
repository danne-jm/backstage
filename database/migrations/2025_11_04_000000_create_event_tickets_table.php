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
        Schema::create('event_tickets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('event_id')->nullable()->index();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('event_name')->nullable();
            $table->dateTime('event_date')->nullable();
            $table->string('unique_trait')->nullable()->index();
            $table->string('ticket_id')->unique();
            $table->timestamps();

            // Optionally add a foreign key if events table exists
            try {
                $table->foreign('event_id')->references('id')->on('events')->onDelete('set null');
            } catch (\Throwable $e) {
                // ignore if events table doesn't exist yet during dev
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_tickets');
    }
};
