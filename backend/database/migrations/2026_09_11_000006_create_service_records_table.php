<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained()->onDelete('cascade');
            $table->date('service_date');
            $table->decimal('odometer', 12, 2);
            $table->string('workshop_name')->nullable();
            $table->string('mechanic_name')->nullable();
            $table->string('mechanic_phone')->nullable();
            $table->decimal('total_cost', 10, 2)->default(0);
            $table->json('services_performed')->nullable();
            $table->decimal('next_service_due_odometer', 12, 2)->nullable();
            $table->string('bill_photo_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_records');
    }
};
