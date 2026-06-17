<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('office_shift_workers', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('office_shift_id')->constrained('office_shifts')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('worker'); // cashier, supervisor
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_shift_workers');
    }
};
