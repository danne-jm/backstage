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
        Schema::create('mails', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('event_id')->nullable()->constrained('sellables')->onDelete('cascade');
            $table->foreignUlid('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('recipient_email');
            $table->string('subject')->nullable();
            $table->longText('body')->nullable();
            $table->boolean('success')->default(false);
            $table->text('error_message')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index('recipient_email');
            $table->index('success');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mails');
    }
};
