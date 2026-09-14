<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fuel_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->date('fuel_date');
            $table->decimal('quantity_litres', 8, 2);
            $table->decimal('price_per_unit', 10, 2);
            $table->decimal('total_cost', 10, 2);
            $table->decimal('odometer', 12, 2);
            $table->string('fuel_station')->nullable();
            $table->enum('fill_type', ['full', 'partial'])->default('full');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fuel_entries');
    }
};
