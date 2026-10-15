<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    private function checkOwnership(Vehicle $vehicle)
    {
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized access to vehicle');
        }
    }

    public function index(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        $query = $vehicle->expenses();

        if ($request->has('category') && !empty($request->category) && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->get();

        return response()->json($expenses);
    }

    public function store(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        $this->checkOwnership($vehicle);

        if (!$request->has('expense_date') && $request->has('date')) {
            $request->merge(['expense_date' => $request->input('date')]);
        }

        $validated = $request->validate([
            'category' => 'nullable|string|max:100',
            'expense_date' => 'required|date',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|gt:0',
        ]);

        $category = !empty($validated['category']) ? strtolower(trim($validated['category'])) : 'other';

        $expense = $vehicle->expenses()->create([
            'category' => $category,
            'expense_date' => $validated['expense_date'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
        ]);

        return response()->json($expense, 201);
    }
}
