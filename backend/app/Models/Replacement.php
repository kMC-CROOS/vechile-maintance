<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Replacement extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'type',
        'component_name',
        'replacement_date',
        'odometer',
        'part_cost',
        'labour_cost',
        'total_cost',
        'has_warranty',
        'warranty_expiry_date',
        'expected_next_km',
        'expected_next_date',
        'workshop_name',
        'invoice_path',
        'photo_path',
    ];

    protected $casts = [
        'replacement_date' => 'date',
        'warranty_expiry_date' => 'date',
        'expected_next_date' => 'date',
        'odometer' => 'decimal:2',
        'part_cost' => 'decimal:2',
        'labour_cost' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'expected_next_km' => 'decimal:2',
        'has_warranty' => 'boolean',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
