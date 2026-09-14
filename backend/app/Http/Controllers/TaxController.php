<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleTaxRecord;
use Illuminate\Http\Request;

class TaxController extends Controller
{
    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $validated = $request->validate([
            'valid_until' => 'required|date',
            'amount_paid' => 'required|numeric|min:0',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $documentPath = null;
        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('documents', 'public');
            $documentPath = asset('storage/' . $path);
        }

        $taxData = [
            'valid_until' => $validated['valid_until'],
            'amount_paid' => $validated['amount_paid'],
        ];

        if ($documentPath) {
            $taxData['document_path'] = $documentPath;
        }

        $tax = $vehicle->taxRecord()->updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            $taxData
        );

        return response()->json($tax);
    }
}
