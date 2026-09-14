<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\FuelEntry;
use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function show(Request $request, $vehicleId)
    {
        $vehicle = Vehicle::findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $period = $request->query('period', '6m');
        $monthsCount = match ($period) {
            '1m' => 1,
            '3m' => 3,
            '6m' => 6,
            '1y' => 12,
            default => 6,
        };

        $endDate = Carbon::now()->endOfMonth();
        $startDate = Carbon::now()->subMonths($monthsCount - 1)->startOfMonth();

        $expenses = Expense::where('vehicle_id', $vehicle->id)
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        $totalCost = (float) $expenses->sum('amount');
        $fuelCost = (float) $expenses->where('category', 'fuel')->sum('amount');
        $serviceCost = (float) $expenses->where('category', 'service')->sum('amount');
        $replacementCost = (float) $expenses->where('category', 'replacement')->sum('amount');
        $otherCost = (float) $expenses->where('category', 'other')->sum('amount');

        $categoryBreakdown = [
            'fuel' => $totalCost > 0 ? round(($fuelCost / $totalCost) * 100, 1) : 0,
            'service' => $totalCost > 0 ? round(($serviceCost / $totalCost) * 100, 1) : 0,
            'replacement' => $totalCost > 0 ? round(($replacementCost / $totalCost) * 100, 1) : 0,
            'other' => $totalCost > 0 ? round(($otherCost / $totalCost) * 100, 1) : 0,
        ];

        // Monthly trend series
        $monthlyTrend = [];
        $tempDate = $startDate->copy();
        while ($tempDate->lte($endDate)) {
            $monthKey = $tempDate->format('Y-m');
            $monthLabel = $tempDate->format('M Y');

            $mExpenses = $expenses->filter(function ($e) use ($monthKey) {
                return Carbon::parse($e->expense_date)->format('Y-m') === $monthKey;
            });

            $mFuel = (float) $mExpenses->where('category', 'fuel')->sum('amount');
            $mService = (float) $mExpenses->where('category', 'service')->sum('amount');
            $mRepl = (float) $mExpenses->where('category', 'replacement')->sum('amount');
            $mOther = (float) $mExpenses->where('category', 'other')->sum('amount');

            $monthlyTrend[] = [
                'month' => $monthLabel,
                'fuel' => $mFuel,
                'service' => $mService,
                'replacement' => $mRepl,
                'other' => $mOther,
                'total' => $mFuel + $mService + $mRepl + $mOther,
            ];

            $tempDate->addMonth();
        }

        // Fuel Efficiency Calculation (KM/L)
        $fuelEntries = FuelEntry::where('vehicle_id', $vehicle->id)
            ->whereBetween('fuel_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->orderBy('odometer', 'asc')
            ->get();

        $avgKmL = 0;
        if ($fuelEntries->count() >= 2) {
            $minOdo = (float) $fuelEntries->first()->odometer;
            $maxOdo = (float) $fuelEntries->last()->odometer;
            $distTraveled = $maxOdo - $minOdo;
            // Litres consumed after first fill
            $totalLitres = (float) $fuelEntries->skip(1)->sum('quantity_litres');

            if ($totalLitres > 0 && $distTraveled > 0) {
                $avgKmL = round($distTraveled / $totalLitres, 2);
            }
        }

        // Cost Per KM
        $firstEntryOdo = (float) ($fuelEntries->first()?->odometer ?? $vehicle->current_odometer);
        $totalDistance = max(0, (float) $vehicle->current_odometer - $firstEntryOdo);
        $costPerKm = ($totalDistance > 0 && $totalCost > 0) ? round($totalCost / $totalDistance, 2) : 0;

        // Activity counts
        $servicesCount = $vehicle->serviceRecords()->whereBetween('service_date', [$startDate->toDateString(), $endDate->toDateString()])->count();
        $fuelCount = $fuelEntries->count();
        $replacementsCount = $vehicle->replacements()->whereBetween('replacement_date', [$startDate->toDateString(), $endDate->toDateString()])->count();

        return response()->json([
            'period' => $period,
            'cost_tiles' => [
                'total' => $totalCost,
                'fuel' => $fuelCost,
                'service' => $serviceCost,
                'replacement' => $replacementCost,
                'other' => $otherCost,
            ],
            'category_breakdown' => $categoryBreakdown,
            'monthly_trend' => $monthlyTrend,
            'fuel_efficiency_km_l' => $avgKmL,
            'cost_per_km' => $costPerKm,
            'activity_counts' => [
                'services' => $servicesCount,
                'fuel_entries' => $fuelCount,
                'replacements' => $replacementsCount,
            ],
        ]);
    }
}
