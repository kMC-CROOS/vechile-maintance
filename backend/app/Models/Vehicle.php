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
    ];

    protected $casts = [
        'current_odometer' => 'decimal:2',
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
