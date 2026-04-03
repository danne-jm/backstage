<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tickets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('event_id')->constrained('events')->onDelete('cascade');
            $table->foreignUlid('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ticket_code')->unique();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email');
            $table->string('event_name')->nullable();
            $table->dateTime('event_date')->nullable();
            $table->string('unique_trait')->nullable();
            $table->integer('scan_count')->default(0);
            $table->json('scan_details')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();

            $table->index('ticket_code');
            $table->index('email');
            $table->index('event_id');
            $table->index('scanned_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
