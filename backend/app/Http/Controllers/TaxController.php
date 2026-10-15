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

        if (!$request->has('valid_until') && $request->has('expiry_date')) {
            $request->merge(['valid_until' => $request->input('expiry_date')]);
        }
        if (!$request->has('amount_paid') && $request->has('amount')) {
            $request->merge(['amount_paid' => $request->input('amount')]);
        }
        if (!$request->has('amount_paid')) {
            $request->merge(['amount_paid' => 0]);
        }

        $validated = $request->validate([
            'valid_until' => 'required|date',
            'amount_paid' => 'nullable|numeric|min:0',
            'document' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
        ]);

        $documentPath = null;
        if ($request->hasFile('document')) {
            $path = $request->file('document')->store('documents', 'public');
            $documentPath = asset('storage/' . $path);
        }

        $taxData = [
            'valid_until' => $validated['valid_until'],
            'amount_paid' => $validated['amount_paid'] ?? 0,
        ];

        if ($documentPath) {
            $taxData['document_path'] = $documentPath;
        }

        $tax = $vehicle->taxRecord()->updateOrCreate(
            ['vehicle_id' => $vehicle->id],
            $taxData
        );

        return response()->json($tax, 201);
    }
}
