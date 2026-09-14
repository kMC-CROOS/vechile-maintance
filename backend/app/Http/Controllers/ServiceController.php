<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ServiceRecord;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    private function checkOwnership(Vehicle $vehicle)
    {
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to vehicle');
        }
    }

    public function index($vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        return response()->json($vehicle->serviceRecords);
    }

    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        $validated = $request->validate([
            'service_date' => 'required|date',
            'odometer' => 'required|numeric|min:0',
            'workshop_name' => 'nullable|string',
            'mechanic_name' => 'nullable|string',
            'mechanic_phone' => 'nullable|string',
            'total_cost' => 'required|numeric|min:0',
            'services_performed' => 'nullable|array',
            'next_service_due_odometer' => 'nullable|numeric|min:0',
            'bill_photo' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'notes' => 'nullable|string',
        ]);

        $billPhotoPath = null;
        if ($request->hasFile('bill_photo')) {
            $path = $request->file('bill_photo')->store('services', 'public');
            $billPhotoPath = asset('storage/' . $path);
        }

        $serviceRecord = $vehicle->serviceRecords()->create([
            'service_date' => $validated['service_date'],
            'odometer' => $validated['odometer'],
            'workshop_name' => $validated['workshop_name'] ?? null,
            'mechanic_name' => $validated['mechanic_name'] ?? null,
            'mechanic_phone' => $validated['mechanic_phone'] ?? null,
            'total_cost' => $validated['total_cost'],
            'services_performed' => $validated['services_performed'] ?? [],
            'next_service_due_odometer' => $validated['next_service_due_odometer'] ?? null,
            'bill_photo_path' => $billPhotoPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update vehicle odometer if higher
        if ($validated['odometer'] > $vehicle->current_odometer) {
            $vehicle->update(['current_odometer' => $validated['odometer']]);
        }

        // Auto-create matching expense record
        $servicesText = !empty($validated['services_performed'])
            ? implode(', ', array_map('ucwords', str_replace('_', ' ', $validated['services_performed'])))
            : 'Vehicle Service';
        $desc = ($validated['workshop_name'] ?? 'Service') . ' - ' . $servicesText;

        Expense::create([
            'vehicle_id' => $vehicle->id,
            'category' => 'service',
            'expense_date' => $validated['service_date'],
            'description' => $desc,
            'amount' => $validated['total_cost'],
            'source_type' => ServiceRecord::class,
            'source_id' => $serviceRecord->id,
        ]);

        return response()->json($serviceRecord, 201);
    }

    public function show($id)
    {
        $serviceRecord = ServiceRecord::with('vehicle')->findOrFail($id);
        $this->checkOwnership($serviceRecord->vehicle);

        return response()->json($serviceRecord);
    }

    public function update(Request $request, $id)
    {
        $serviceRecord = ServiceRecord::with('vehicle')->findOrFail($id);
        $this->checkOwnership($serviceRecord->vehicle);

        $validated = $request->validate([
            'service_date' => 'sometimes|required|date',
            'odometer' => 'sometimes|required|numeric|min:0',
            'workshop_name' => 'nullable|string',
            'mechanic_name' => 'nullable|string',
            'mechanic_phone' => 'nullable|string',
            'total_cost' => 'sometimes|required|numeric|min:0',
            'services_performed' => 'nullable|array',
            'next_service_due_odometer' => 'nullable|numeric|min:0',
            'bill_photo' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'notes' => 'nullable|string',
        ]);

        if ($request->hasFile('bill_photo')) {
            $path = $request->file('bill_photo')->store('services', 'public');
            $validated['bill_photo_path'] = asset('storage/' . $path);
        }

        $serviceRecord->update($validated);

        // Update corresponding expense
        Expense::where('source_type', ServiceRecord::class)
            ->where('source_id', $serviceRecord->id)
            ->update([
                'expense_date' => $serviceRecord->service_date,
                'amount' => $serviceRecord->total_cost,
            ]);

        return response()->json($serviceRecord);
    }

    public function destroy($id)
    {
        $serviceRecord = ServiceRecord::with('vehicle')->findOrFail($id);
        $this->checkOwnership($serviceRecord->vehicle);

        // Delete expense record
        Expense::where('source_type', ServiceRecord::class)
            ->where('source_id', $serviceRecord->id)
            ->delete();

        $serviceRecord->delete();

        return response()->json(['message' => 'Service record deleted']);
    }
}
