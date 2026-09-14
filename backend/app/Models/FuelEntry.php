<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FuelEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'fuel_date',
        'quantity_litres',
        'price_per_unit',
        'total_cost',
        'odometer',
        'fuel_station',
        'fill_type',
        'notes',
    ];

    protected $casts = [
        'fuel_date' => 'date',
        'quantity_litres' => 'decimal:2',
        'price_per_unit' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'odometer' => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
