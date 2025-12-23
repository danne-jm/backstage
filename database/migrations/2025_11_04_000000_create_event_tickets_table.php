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
        // Create the table on the separate 'tickets' connection. We avoid
        // creating a foreign key across database connections because most
        // DBMS do not support cross-database foreign key constraints.
        if (! Schema::connection('tickets')->hasTable('event_tickets')) {
            Schema::connection('tickets')->create('event_tickets', function (Blueprint $table) {
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

                // Note: do NOT add a foreign key referencing `events` here because
                // `events` lives in the main connection and cross-connection FKs
                // are not portable. The application should enforce referential
                // integrity at the application level when needed.
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('tickets')->dropIfExists('event_tickets');
    }
};
