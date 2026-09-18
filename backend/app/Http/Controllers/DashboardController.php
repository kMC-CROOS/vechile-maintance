<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function show($vehicleId)
    {
        $vehicle = Vehicle::with(['insurance', 'warranty', 'taxRecord'])->findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        // 1. This month totals by category
        $monthExpenses = Expense::where('vehicle_id', $vehicle->id)
            ->whereBetween('expense_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
            ->get();

        $fuelTotal = (float) $monthExpenses->where('category', 'fuel')->sum('amount');
        $serviceTotal = (float) $monthExpenses->where('category', 'service')->sum('amount');
        $replacementTotal = (float) $monthExpenses->where('category', 'replacement')->sum('amount');
        $otherTotal = (float) $monthExpenses->where('category', 'other')->sum('amount');
        $grandTotal = $fuelTotal + $serviceTotal + $replacementTotal + $otherTotal;

        // 2. Reminders call internally
        $reminderController = new ReminderController();
        $remindersResponse = $reminderController->index($vehicleId);
        $remindersData = json_decode($remindersResponse->getContent(), true);

        // Top 3 items: overdue first, then due_soon, then upcoming
        $allReminders = array_merge(
            $remindersData['overdue'] ?? [],
            $remindersData['due_soon'] ?? [],
            $remindersData['upcoming'] ?? []
        );
        $topReminders = array_slice($allReminders, 0, 3);

        // 3. Last & next service
        $lastServiceRecord = $vehicle->serviceRecords()->orderBy('service_date', 'desc')->first();
        $lastService = $lastServiceRecord ? [
            'date' => $lastServiceRecord->service_date ? Carbon::parse($lastServiceRecord->service_date)->format('d M Y') : null,
            'odometer' => (float) $lastServiceRecord->odometer,
            'cost' => (float) $lastServiceRecord->total_cost,
            'workshop' => $lastServiceRecord->workshop_name,
        ] : null;

        $nextServiceDue = $lastServiceRecord && $lastServiceRecord->next_service_due_odometer
            ? (float) $lastServiceRecord->next_service_due_odometer
            : null;

        // 4. Recent activity feed (last 10 items)
        $recentExpenses = $vehicle->expenses()
            ->orderBy('expense_date', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'category' => $item->category,
                    'description' => $item->description,
                    'amount' => (float) $item->amount,
                    'date' => $item->expense_date ? Carbon::parse($item->expense_date)->format('d M Y') : null,
                ];
            });

        // 5. Total all-time expenses & avg mileage
        $totalAllExpenses = (float) Expense::where('vehicle_id', $vehicle->id)->sum('amount');

        $fuelEntries = $vehicle->fuelEntries()->orderBy('odometer', 'asc')->get();
        $avgMileage = null;
        if ($fuelEntries->count() >= 2) {
            $totalLitres = (float) $fuelEntries->sum('quantity_litres');
            $minOdo = (float) $fuelEntries->min('odometer');
            $maxOdo = (float) $fuelEntries->max('odometer');
            $kmDriven = $maxOdo - $minOdo;
            if ($totalLitres > 0 && $kmDriven > 0) {
                $avgMileage = number_format($kmDriven / $totalLitres, 1) . ' KM/L';
            }
        } elseif ($fuelEntries->count() === 1 && (float) $vehicle->current_odometer > (float) $fuelEntries->first()->odometer) {
            $entry = $fuelEntries->first();
            $totalLitres = (float) $entry->quantity_litres;
            $kmDriven = (float) $vehicle->current_odometer - (float) $entry->odometer;
            if ($totalLitres > 0 && $kmDriven > 0) {
                $avgMileage = number_format($kmDriven / $totalLitres, 1) . ' KM/L';
            }
        }

        return response()->json([
            'vehicle' => $vehicle,
            'odometer' => (float) $vehicle->current_odometer,
            'this_month_totals' => [
                'fuel' => $fuelTotal,
                'service' => $serviceTotal,
                'replacement' => $replacementTotal,
                'other' => $otherTotal,
                'total' => $grandTotal,
            ],
            'total_expenses' => $totalAllExpenses,
            'avg_mileage' => $avgMileage,
            'top_reminders' => $topReminders,
            'last_service' => $lastService,
            'next_service_due_odometer' => $nextServiceDue,
            'recent_activity' => $recentExpenses,
        ])->withHeaders([
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
        ]);
    }
}
