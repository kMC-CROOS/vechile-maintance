<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleInsurance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class InsuranceController extends Controller
{
    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'provider' => 'nullable|string',
            'policy_number' => 'nullable|string',
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

        $insuranceData = [
            'provider' => $validated['provider'] ?? null,
            'policy_number' => $validated['policy_number'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'expiry_date' => $validated['expiry_date'],
            'reminder_days_before' => $validated['reminder_days_before'] ?? 30,
        ];

        if ($documentPath) {
            $insuranceData['document_path'] = $documentPath;
        }

        $insurance = $vehicle->insurance()->updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            $insuranceData
        );

        return response()->json($insurance);
    }
}
