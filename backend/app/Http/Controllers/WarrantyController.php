<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleWarranty;
use Illuminate\Http\Request;

class WarrantyController extends Controller
{
    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'start_date' => 'nullable|date',
            'expiry_date' => 'required|date',
            'reminder_days_before' => 'nullable|integer',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $documentPath = null;
        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('documents', 'public');
            $documentPath = asset('storage/' . $path);
        }

        $warrantyData = [
            'start_date' => $validated['start_date'] ?? null,
            'expiry_date' => $validated['expiry_date'],
            'reminder_days_before' => $validated['reminder_days_before'] ?? 30,
        ];

        if ($documentPath) {
            $warrantyData['document_path'] = $documentPath;
        }

        $warranty = $vehicle->warranty()->updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            $warrantyData
        );

        return response()->json($warranty);
    }
}
