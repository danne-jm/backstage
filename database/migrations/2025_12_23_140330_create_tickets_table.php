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
        Schema::create('tickets', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('event_id')->constrained()->onDelete('cascade');
            $table->foreignUlid('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('ticket_code')->unique();
            // Old ticket fields for feature parity
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('email');
            $table->string('unique_trait')->nullable();
            $table->unsignedInteger('scan_count')->default(0);
            $table->json('scan_details')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('scanned_at')->nullable();
            $table->timestamps();
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
