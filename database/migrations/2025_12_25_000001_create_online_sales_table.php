<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('online_sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('event_id')->nullable();
            $table->string('method')->nullable();
            $table->decimal('amount', 10, 2)->default(0);
            $table->json('details')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamps();

            $table->index('sold_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('online_sales');
    }
};
