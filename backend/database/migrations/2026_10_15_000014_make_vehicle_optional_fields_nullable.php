<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('fuel_type')->nullable()->change();
            $table->string('country_of_origin')->nullable()->change();
            $table->string('cylinder_capacity')->nullable()->change();
            $table->string('vehicle_class')->nullable()->change();
            $table->string('body_type')->nullable()->change();
            $table->integer('year_of_manufacture')->nullable()->change();
            $table->decimal('wheel_base', 10, 2)->nullable()->change();
            $table->decimal('overhang', 10, 2)->nullable()->change();
            $table->string('previous_owners')->nullable()->change();
            $table->string('status_when_registered')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('fuel_type')->nullable(false)->change();
        });
    }
};
