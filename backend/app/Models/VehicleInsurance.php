<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleInsurance extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'provider',
        'policy_number',
        'start_date',
        'expiry_date',
        'document_path',
        'reminder_days_before',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expiry_date' => 'date',
        'reminder_days_before' => 'integer',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
