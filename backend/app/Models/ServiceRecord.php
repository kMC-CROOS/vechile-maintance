<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'service_date',
        'odometer',
        'workshop_name',
        'mechanic_name',
        'mechanic_phone',
        'total_cost',
        'services_performed',
        'next_service_due_odometer',
        'bill_photo_path',
        'notes',
    ];

    protected $casts = [
        'service_date' => 'date',
        'odometer' => 'decimal:2',
        'total_cost' => 'decimal:2',
        'next_service_due_odometer' => 'decimal:2',
        'services_performed' => 'array',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
