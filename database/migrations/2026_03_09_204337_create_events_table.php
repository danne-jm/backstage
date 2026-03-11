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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('variants_config')->nullable();
            $table->boolean('is_variant_based')->default(false);
            $table->dateTime('event_date')->nullable();
            $table->dateTime('start_sell_date')->nullable();
            $table->dateTime('end_sell_date')->nullable();
            $table->string('google_spreadsheet_id')->nullable();
            $table->string('instagram_link')->nullable();
            $table->string('google_sheet_name')->nullable();
            $table->decimal('price_with_card', 8, 2)->default(0);
            $table->decimal('price_without_card', 8, 2)->default(0);
            $table->integer('quantity')->nullable();
            $table->boolean('unlimited_quantity')->default(false);
            $table->unsignedBigInteger('responsible_user_id')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('variable_amount')->default(false);
            $table->integer('quantity_with_card')->nullable();
            $table->integer('sold_count_with_card')->default(0);
            $table->boolean('unlimited_quantity_with_card')->default(false);
            $table->integer('quantity_without_card')->nullable();
            $table->integer('sold_count_without_card')->default(0);
            $table->boolean('unlimited_quantity_without_card')->default(false);
            $table->boolean('is_online_sellable')->default(false);
            $table->json('attendee_filter_config')->nullable();
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
