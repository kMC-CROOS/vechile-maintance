<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'brand',
        'model',
        'registration_number',
        'fuel_type',
        'transmission',
        'current_odometer',
        'engine_capacity',
        'notes',
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
    ];

    protected $casts = [
        'current_odometer' => 'decimal:2',
        'date_of_first_registration' => 'date',
        'year_of_manufacture' => 'integer',
        'seating_capacity' => 'integer',
        'weight_kg' => 'integer',
        'cylinder_capacity' => 'integer',
        'wheel_base' => 'integer',
        'overhang' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function insurance()
    {
        return $this->hasOne(VehicleInsurance::class);
    }

    public function warranty()
    {
        return $this->hasOne(VehicleWarranty::class);
    }

    public function taxRecord()
    {
        return $this->hasOne(VehicleTaxRecord::class);
    }

    public function serviceRecords()
    {
        return $this->hasMany(ServiceRecord::class)->orderBy('service_date', 'desc');
    }

    public function fuelEntries()
    {
        return $this->hasMany(FuelEntry::class)->orderBy('fuel_date', 'desc');
    }

    public function replacements()
    {
        return $this->hasMany(Replacement::class)->orderBy('replacement_date', 'desc');
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class)->orderBy('expense_date', 'desc');
    }
}
