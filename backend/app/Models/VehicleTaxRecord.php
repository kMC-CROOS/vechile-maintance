<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleTaxRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'vehicle_id',
        'valid_until',
        'amount_paid',
        'document_path',
    ];

    protected $casts = [
        'valid_until' => 'date',
        'amount_paid' => 'decimal:2',
    ];

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
}
