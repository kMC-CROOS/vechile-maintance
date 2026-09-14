<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Replacement;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ReplacementController extends Controller
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

        return response()->json($vehicle->replacements);
    }

    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        $validated = $request->validate([
            'type' => 'required|string', // tyre, battery, brakes, other
            'component_name' => 'required|string',
            'replacement_date' => 'required|date',
            'odometer' => 'required|numeric|min:0',
            'part_cost' => 'required|numeric|min:0',
            'labour_cost' => 'nullable|numeric|min:0',
            'has_warranty' => 'nullable|boolean',
            'warranty_expiry_date' => 'nullable|date',
            'expected_next_km' => 'nullable|numeric|min:0',
            'expected_next_date' => 'nullable|date',
            'workshop_name' => 'nullable|string',
            'invoice' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:10240',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png|max:10240',
        ]);

        $partCost = $validated['part_cost'];
        $labourCost = $validated['labour_cost'] ?? 0;
        $totalCost = round($partCost + $labourCost, 2);

        $invoicePath = null;
        if ($request->hasFile('invoice')) {
            $path = $request->file('invoice')->store('invoices', 'public');
            $invoicePath = asset('storage/' . $path);
        }

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('photos', 'public');
            $photoPath = asset('storage/' . $path);
        }

        $replacement = $vehicle->replacements()->create([
            'type' => $validated['type'],
            'component_name' => $validated['component_name'],
            'replacement_date' => $validated['replacement_date'],
            'odometer' => $validated['odometer'],
            'part_cost' => $partCost,
            'labour_cost' => $labourCost,
            'total_cost' => $totalCost,
            'has_warranty' => $validated['has_warranty'] ?? false,
            'warranty_expiry_date' => $validated['warranty_expiry_date'] ?? null,
            'expected_next_km' => $validated['expected_next_km'] ?? null,
            'expected_next_date' => $validated['expected_next_date'] ?? null,
            'workshop_name' => $validated['workshop_name'] ?? null,
            'invoice_path' => $invoicePath,
            'photo_path' => $photoPath,
        ]);

        // Update vehicle odometer if higher
        if ($validated['odometer'] > $vehicle->current_odometer) {
            $vehicle->update(['current_odometer' => $validated['odometer']]);
        }

        // Auto-create expense record
        $workshop = $validated['workshop_name'] ?? 'Workshop';
        $desc = "Replacement: {$validated['component_name']} ({$workshop})";

        Expense::create([
            'vehicle_id' => $vehicle->id,
            'category' => 'replacement',
            'expense_date' => $validated['replacement_date'],
            'description' => $desc,
            'amount' => $totalCost,
            'source_type' => Replacement::class,
            'source_id' => $replacement->id,
        ]);

        return response()->json($replacement, 201);
    }
}
