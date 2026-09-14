<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use App\Models\VehicleInsurance;
use App\Models\VehicleWarranty;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    private function checkOwnership(Vehicle $vehicle)
    {
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to vehicle');
        }
    }

    public function index(Request $request)
    {
        $vehicles = $request->user()->vehicles()
            ->with(['insurance', 'warranty', 'taxRecord'])
            ->get();

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'brand' => 'required|string',
            'model' => 'required|string',
            'registration_number' => 'required|string',
            'fuel_type' => 'required|string',
            'transmission' => 'required|string',
            'current_odometer' => 'required|numeric|min:0',
            'engine_capacity' => 'nullable|string',
            'notes' => 'nullable|string',
            // Optional nested insurance
            'insurance_provider' => 'nullable|string',
            'insurance_policy_number' => 'nullable|string',
            'insurance_start_date' => 'nullable|date',
            'insurance_expiry_date' => 'nullable|date',
            'insurance_reminder_days' => 'nullable|integer',
            // Optional nested warranty
            'warranty_start_date' => 'nullable|date',
            'warranty_expiry_date' => 'nullable|date',
            'warranty_reminder_days' => 'nullable|integer',
        ]);

        $vehicle = $request->user()->vehicles()->create([
            'type' => $validated['type'],
            'brand' => $validated['brand'],
            'model' => $validated['model'],
            'registration_number' => $validated['registration_number'],
            'fuel_type' => $validated['fuel_type'],
            'transmission' => $validated['transmission'],
            'current_odometer' => $validated['current_odometer'],
            'engine_capacity' => $validated['engine_capacity'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['insurance_expiry_date'])) {
            $vehicle->insurance()->create([
                'provider' => $validated['insurance_provider'] ?? null,
                'policy_number' => $validated['insurance_policy_number'] ?? null,
                'start_date' => $validated['insurance_start_date'] ?? null,
                'expiry_date' => $validated['insurance_expiry_date'],
                'reminder_days_before' => $validated['insurance_reminder_days'] ?? 30,
            ]);
        }

        if (!empty($validated['warranty_expiry_date'])) {
            $vehicle->warranty()->create([
                'start_date' => $validated['warranty_start_date'] ?? null,
                'expiry_date' => $validated['warranty_expiry_date'],
                'reminder_days_before' => $validated['warranty_reminder_days'] ?? 30,
            ]);
        }

        return response()->json($vehicle->load(['insurance', 'warranty', 'taxRecord']), 201);
    }

    public function show($id)
    {
        $vehicle = Vehicle::with(['insurance', 'warranty', 'taxRecord'])->findOrFail($id);
        $this->checkOwnership($vehicle);

        return response()->json($vehicle);
    }

    public function update(Request $request, $id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $this->checkOwnership($vehicle);

        $validated = $request->validate([
            'type' => 'sometimes|required|string',
            'brand' => 'sometimes|required|string',
            'model' => 'sometimes|required|string',
            'registration_number' => 'sometimes|required|string',
            'fuel_type' => 'sometimes|required|string',
            'transmission' => 'sometimes|required|string',
            'current_odometer' => 'sometimes|required|numeric|min:0',
            'engine_capacity' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $vehicle->update($validated);

        return response()->json($vehicle->load(['insurance', 'warranty', 'taxRecord']));
    }

    public function destroy($id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $this->checkOwnership($vehicle);

        $vehicle->delete();

        return response()->json(['message' => 'Vehicle deleted successfully']);
    }
}
