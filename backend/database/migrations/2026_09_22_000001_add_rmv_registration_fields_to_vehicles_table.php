<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->string('chassis_number')->nullable();
            $table->string('engine_number')->nullable();
            $table->text('owner_details')->nullable();
            $table->text('conditions_special_notes')->nullable();
            $table->string('absolute_owner')->nullable();
            $table->string('cylinder_capacity')->nullable();
            $table->string('vehicle_class')->nullable();
            $table->string('taxation_class')->nullable();
            $table->string('status_when_registered')->nullable();
            $table->string('country_of_origin')->nullable();
            $table->string('manufacturer_description')->nullable();
            $table->decimal('wheel_base', 10, 2)->nullable();
            $table->decimal('overhang', 10, 2)->nullable();
            $table->string('body_type')->nullable();
            $table->integer('year_of_manufacture')->nullable();
            $table->string('colour')->nullable();
            $table->string('previous_owners')->nullable();
            $table->integer('seating_capacity')->nullable();
            $table->decimal('weight_kg', 10, 2)->nullable();
            $table->string('tyre_size')->nullable();
            $table->string('dimensions')->nullable();
            $table->string('internal_height')->nullable();
            $table->string('provincial_council')->nullable();
            $table->date('date_of_first_registration')->nullable();
            $table->string('taxes_payable')->nullable();
            $table->string('photo_url')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn([
                'chassis_number',
                'engine_number',
                'owner_details',
                'conditions_special_notes',
                'absolute_owner',
                'cylinder_capacity',
                'vehicle_class',
                'taxation_class',
                'status_when_registered',
                'country_of_origin',
                'manufacturer_description',
                'wheel_base',
                'overhang',
                'body_type',
                'year_of_manufacture',
                'colour',
                'previous_owners',
                'seating_capacity',
                'weight_kg',
                'tyre_size',
                'dimensions',
                'internal_height',
                'provincial_council',
                'date_of_first_registration',
                'taxes_payable',
                'photo_url',
            ]);
        });
    }
};
