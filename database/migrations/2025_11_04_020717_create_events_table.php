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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('event_date');
            $table->date('start_sell_date');
            $table->date('end_sell_date');
            $table->decimal('price_with_card', 10, 2);
            $table->decimal('price_without_card', 10, 2);
            $table->integer('quantity')->nullable();
            $table->foreignId('responsible_user_id')->constrained('users')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->boolean('variable_amount')->default(false);
            $table->integer('quantity_with_card')->nullable();
            $table->integer('quantity_without_card')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
