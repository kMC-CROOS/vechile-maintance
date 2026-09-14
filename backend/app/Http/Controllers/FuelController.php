<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\FuelEntry;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class FuelController extends Controller
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

        return response()->json($vehicle->fuelEntries);
    }

    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        $validated = $request->validate([
            'fuel_date' => 'required|date',
            'quantity_litres' => 'required|numeric|gt:0',
            'price_per_unit' => 'required|numeric|gt:0',
            'odometer' => 'required|numeric|min:0',
            'fuel_station' => 'nullable|string',
            'fill_type' => 'required|in:full,partial',
            'notes' => 'nullable|string',
        ]);

        // Auto compute total cost server-side
        $totalCost = round($validated['quantity_litres'] * $validated['price_per_unit'], 2);

        $fuelEntry = $vehicle->fuelEntries()->create([
            'fuel_date' => $validated['fuel_date'],
            'quantity_litres' => $validated['quantity_litres'],
            'price_per_unit' => $validated['price_per_unit'],
            'total_cost' => $totalCost,
            'odometer' => $validated['odometer'],
            'fuel_station' => $validated['fuel_station'] ?? null,
            'fill_type' => $validated['fill_type'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update vehicle odometer if higher
        if ($validated['odometer'] > $vehicle->current_odometer) {
            $vehicle->update(['current_odometer' => $validated['odometer']]);
        }

        // Auto-create expense record
        $station = $validated['fuel_station'] ?? 'Fuel Station';
        $desc = "{$station} ({$validated['quantity_litres']}L @ {$validated['price_per_unit']})";

        Expense::create([
            'vehicle_id' => $vehicle->id,
            'category' => 'fuel',
            'expense_date' => $validated['fuel_date'],
            'description' => $desc,
            'amount' => $totalCost,
            'source_type' => FuelEntry::class,
            'source_id' => $fuelEntry->id,
        ]);

        return response()->json($fuelEntry, 201);
    }
}
