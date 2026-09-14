<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('type'); // car, bike, three-wheeler, etc.
            $table->string('brand');
            $table->string('model');
            $table->string('registration_number');
            $table->string('fuel_type');
            $table->string('transmission');
            $table->decimal('current_odometer', 12, 2)->default(0);
            $table->string('engine_capacity')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
