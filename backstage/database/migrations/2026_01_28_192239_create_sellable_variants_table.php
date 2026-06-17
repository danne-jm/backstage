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
        Schema::create('sellable_variants', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('sellable_id');
            $table->string('sellable_type');
            $table->json('options'); // {"Size": "S", "Color": "Red"}
            $table->integer('quantity')->nullable(); // Null = Unlimited
            $table->integer('sold_count')->default(0);
            $table->timestamps();

            $table->index(['sellable_id', 'sellable_type']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->json('variants_config')->nullable()->after('description'); // Definition of options
        });

        Schema::table('events', function (Blueprint $table) {
            $table->json('variants_config')->nullable()->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sellable_variants');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('variants_config');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('variants_config');
        });
    }
};
