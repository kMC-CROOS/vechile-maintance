<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

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
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($vehicles);
    }

    public function store(Request $request)
    {
        $currentYear = (int) date('Y');

        $validated = $request->validate([
            'registration_number' => [
                'required',
                'string',
                'max:50',
                Rule::unique('vehicles', 'registration_number')->where('user_id', $request->user()->id),
            ],
            'make' => 'required|string|max:100',
            'brand' => 'nullable|string|max:100',
            'current_odometer' => 'required|numeric|min:0',
            
            'type' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'fuel_type' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'engine_capacity' => 'nullable|string|max:50',
            'notes' => 'nullable|string',

            // RMV Registration fields
            'chassis_number' => 'nullable|string|max:100',
            'engine_number' => 'nullable|string|max:100',
            'owner_details' => 'nullable|string',
            'conditions_special_notes' => 'nullable|string',
            'absolute_owner' => 'nullable|string|max:150',
            'cylinder_capacity' => 'nullable|integer|min:0',
            'vehicle_class' => 'nullable|string|max:100',
            'taxation_class' => 'nullable|string|max:100',
            'status_when_registered' => 'nullable|string|max:100',
            'country_of_origin' => 'nullable|string|max:100',
            'manufacturer_description' => 'nullable|string',
            'wheel_base' => 'nullable|integer|min:0',
            'overhang' => 'nullable|integer|min:0',
            'body_type' => 'nullable|string|max:100',
            'year_of_manufacture' => "nullable|integer|min:1900|max:" . ($currentYear + 1),
            'colour' => 'nullable|string|max:100',
            'previous_owners' => 'nullable|string|max:100',
            'seating_capacity' => 'nullable|integer|min:0',
            'weight_kg' => 'nullable|integer|min:0',
            'tyre_size' => 'nullable|string|max:100',
            'dimensions' => 'nullable|string|max:100',
            'internal_height' => 'nullable|string|max:100',
            'provincial_council' => 'nullable|string|max:100',
            'date_of_first_registration' => 'nullable|date|before_or_equal:today',
            'taxes_payable' => 'nullable|string|max:100',
            'photo_url' => 'nullable|string',
            'photo' => 'nullable|file|image|max:10240',

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

        // Handle image file upload if present
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('vehicles', 'public');
            $validated['photo_url'] = url(Storage::url($path));
        }

        // Map brand/make fallback
        $brand = $validated['make'] ?? $validated['brand'] ?? 'Unknown';
        $type = $validated['type'] ?? 'Car';
        $model = $validated['model'] ?? $validated['manufacturer_description'] ?? 'Standard';
        $fuelType = $validated['fuel_type'] ?? 'Petrol';
        $transmission = $validated['transmission'] ?? 'Automatic';

        $vehicleData = array_merge($validated, [
            'brand' => $brand,
            'type' => $type,
            'model' => $model,
            'fuel_type' => $fuelType,
            'transmission' => $transmission,
        ]);

        // Remove non-table attributes
        unset(
            $vehicleData['make'],
            $vehicleData['photo'],
            $vehicleData['insurance_provider'],
            $vehicleData['insurance_policy_number'],
            $vehicleData['insurance_start_date'],
            $vehicleData['insurance_expiry_date'],
            $vehicleData['insurance_reminder_days'],
            $vehicleData['warranty_start_date'],
            $vehicleData['warranty_expiry_date'],
            $vehicleData['warranty_reminder_days']
        );

        $vehicle = $request->user()->vehicles()->create($vehicleData);

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

        $currentYear = (int) date('Y');

        $validated = $request->validate([
            'registration_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('vehicles', 'registration_number')->where('user_id', $request->user()->id)->ignore($vehicle->id),
            ],
            'make' => 'sometimes|required|string|max:100',
            'brand' => 'nullable|string|max:100',
            'current_odometer' => 'sometimes|required|numeric|min:0',

            'type' => 'nullable|string|max:100',
            'model' => 'nullable|string|max:100',
            'fuel_type' => 'nullable|string|max:50',
            'transmission' => 'nullable|string|max:50',
            'engine_capacity' => 'nullable|string|max:50',
            'notes' => 'nullable|string',

            'chassis_number' => 'nullable|string|max:100',
            'engine_number' => 'nullable|string|max:100',
            'owner_details' => 'nullable|string',
            'conditions_special_notes' => 'nullable|string',
            'absolute_owner' => 'nullable|string|max:150',
            'cylinder_capacity' => 'nullable|integer|min:0',
            'vehicle_class' => 'nullable|string|max:100',
            'taxation_class' => 'nullable|string|max:100',
            'status_when_registered' => 'nullable|string|max:100',
            'country_of_origin' => 'nullable|string|max:100',
            'manufacturer_description' => 'nullable|string',
            'wheel_base' => 'nullable|integer|min:0',
            'overhang' => 'nullable|integer|min:0',
            'body_type' => 'nullable|string|max:100',
            'year_of_manufacture' => "nullable|integer|min:1900|max:" . ($currentYear + 1),
            'colour' => 'nullable|string|max:100',
            'previous_owners' => 'nullable|string|max:100',
            'seating_capacity' => 'nullable|integer|min:0',
            'weight_kg' => 'nullable|integer|min:0',
            'tyre_size' => 'nullable|string|max:100',
            'dimensions' => 'nullable|string|max:100',
            'internal_height' => 'nullable|string|max:100',
            'provincial_council' => 'nullable|string|max:100',
            'date_of_first_registration' => 'nullable|date|before_or_equal:today',
            'taxes_payable' => 'nullable|string|max:100',
            'photo_url' => 'nullable|string',
            'photo' => 'nullable|file|image|max:10240',
        ]);

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('vehicles', 'public');
            $validated['photo_url'] = url(Storage::url($path));
        }

        if (isset($validated['make'])) {
            $validated['brand'] = $validated['make'];
            unset($validated['make']);
        }
        unset($validated['photo']);

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
