<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('replacements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->string('type'); // tyre, battery, brakes, other
            $table->string('component_name');
            $table->date('replacement_date');
            $table->decimal('odometer', 12, 2);
            $table->decimal('part_cost', 10, 2)->default(0);
            $table->decimal('labour_cost', 10, 2)->default(0);
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->boolean('has_warranty')->default(false);
            $table->date('warranty_expiry_date')->nullable();
            $table->decimal('expected_next_km', 12, 2)->nullable();
            $table->date('expected_next_date')->nullable();
            $table->string('workshop_name')->nullable();
            $table->string('invoice_path')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('replacements');
    }
};
