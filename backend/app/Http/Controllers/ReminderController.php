<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    public function index($vehicleId)
    {
        $vehicle = Vehicle::with(['insurance', 'warranty', 'taxRecord', 'serviceRecords', 'replacements'])->findOrFail($vehicleId);
        if ($vehicle->user_id !== auth()->id()) {
            abort(403, 'Unauthorized');
        }

        $overdue = [];
        $dueSoon = [];
        $upcoming = [];

        $today = Carbon::today();
        $currentOdo = (float) $vehicle->current_odometer;

        // 1. Service Reminders
        $latestService = $vehicle->serviceRecords->sortByDesc('service_date')->first();
        if ($latestService && $latestService->next_service_due_odometer) {
            $nextOdo = (float) $latestService->next_service_due_odometer;
            $diffKm = $nextOdo - $currentOdo;

            $item = [
                'id' => 'service_' . $latestService->id,
                'category' => 'service',
                'title' => 'Scheduled Service',
                'description' => "Next service due at " . number_format($nextOdo) . " km",
                'due_info' => $diffKm <= 0 ? "Overdue by " . number_format(abs($diffKm)) . " km" : "Due in " . number_format($diffKm) . " km",
                'target_value' => $nextOdo,
            ];

            if ($diffKm <= 0) {
                $item['status'] = 'overdue';
                $overdue[] = $item;
            } elseif ($diffKm <= 500) {
                $item['status'] = 'due_soon';
                $dueSoon[] = $item;
            } else {
                $item['status'] = 'upcoming';
                $upcoming[] = $item;
            }
        }

        // 2. Tax Record
        if ($vehicle->taxRecord && $vehicle->taxRecord->valid_until) {
            $expiry = Carbon::parse($vehicle->taxRecord->valid_until);
            $daysLeft = $today->diffInDays($expiry, false);

            $item = [
                'id' => 'tax_' . $vehicle->taxRecord->id,
                'category' => 'tax',
                'title' => 'Revenue Licence / Tax Renewal',
                'description' => "Valid until " . $expiry->format('d M Y'),
                'due_info' => $daysLeft < 0 ? "Expired " . abs($daysLeft) . " days ago" : ($daysLeft === 0 ? "Expires today" : "Expires in " . $daysLeft . " days"),
                'target_value' => $expiry->toIso8601String(),
            ];

            if ($daysLeft < 0) {
                $item['status'] = 'overdue';
                $overdue[] = $item;
            } elseif ($daysLeft <= 30) {
                $item['status'] = 'due_soon';
                $dueSoon[] = $item;
            } else {
                $item['status'] = 'upcoming';
                $upcoming[] = $item;
            }
        }

        // 3. Insurance Expiry
        if ($vehicle->insurance && $vehicle->insurance->expiry_date) {
            $expiry = Carbon::parse($vehicle->insurance->expiry_date);
            $daysLeft = $today->diffInDays($expiry, false);
            $reminderDays = $vehicle->insurance->reminder_days_before ?? 30;

            $item = [
                'id' => 'insurance_' . $vehicle->insurance->id,
                'category' => 'insurance',
                'title' => 'Insurance Renewal (' . ($vehicle->insurance->provider ?? 'Policy') . ')',
                'description' => "Policy #" . ($vehicle->insurance->policy_number ?? 'N/A') . " expires " . $expiry->format('d M Y'),
                'due_info' => $daysLeft < 0 ? "Expired " . abs($daysLeft) . " days ago" : ($daysLeft === 0 ? "Expires today" : "Expires in " . $daysLeft . " days"),
                'target_value' => $expiry->toIso8601String(),
            ];

            if ($daysLeft < 0) {
                $item['status'] = 'overdue';
                $overdue[] = $item;
            } elseif ($daysLeft <= $reminderDays) {
                $item['status'] = 'due_soon';
                $dueSoon[] = $item;
            } else {
                $item['status'] = 'upcoming';
                $upcoming[] = $item;
            }
        }

        // 4. Warranty Expiry
        if ($vehicle->warranty && $vehicle->warranty->expiry_date) {
            $expiry = Carbon::parse($vehicle->warranty->expiry_date);
            $daysLeft = $today->diffInDays($expiry, false);
            $reminderDays = $vehicle->warranty->reminder_days_before ?? 30;

            $item = [
                'id' => 'warranty_' . $vehicle->warranty->id,
                'category' => 'warranty',
                'title' => 'Vehicle Warranty Expiry',
                'description' => "Warranty valid until " . $expiry->format('d M Y'),
                'due_info' => $daysLeft < 0 ? "Expired " . abs($daysLeft) . " days ago" : ($daysLeft === 0 ? "Expires today" : "Expires in " . $daysLeft . " days"),
                'target_value' => $expiry->toIso8601String(),
            ];

            if ($daysLeft < 0) {
                $item['status'] = 'overdue';
                $overdue[] = $item;
            } elseif ($daysLeft <= $reminderDays) {
                $item['status'] = 'due_soon';
                $dueSoon[] = $item;
            } else {
                $item['status'] = 'upcoming';
                $upcoming[] = $item;
            }
        }

        // 5. Replacement Forecasts
        foreach ($vehicle->replacements as $replacement) {
            if ($replacement->expected_next_km) {
                $nextKm = (float) $replacement->expected_next_km;
                $diffKm = $nextKm - $currentOdo;

                $item = [
                    'id' => 'replacement_km_' . $replacement->id,
                    'category' => 'replacement',
                    'title' => 'Replacement Forecast: ' . $replacement->component_name,
                    'description' => "Expected replacement at " . number_format($nextKm) . " km",
                    'due_info' => $diffKm <= 0 ? "Overdue by " . number_format(abs($diffKm)) . " km" : "Due in " . number_format($diffKm) . " km",
                    'target_value' => $nextKm,
                ];

                if ($diffKm <= 0) {
                    $item['status'] = 'overdue';
                    $overdue[] = $item;
                } elseif ($diffKm <= 1000) {
                    $item['status'] = 'due_soon';
                    $dueSoon[] = $item;
                } else {
                    $item['status'] = 'upcoming';
                    $upcoming[] = $item;
                }
            } elseif ($replacement->expected_next_date) {
                $expiry = Carbon::parse($replacement->expected_next_date);
                $daysLeft = $today->diffInDays($expiry, false);

                $item = [
                    'id' => 'replacement_date_' . $replacement->id,
                    'category' => 'replacement',
                    'title' => 'Replacement Forecast: ' . $replacement->component_name,
                    'description' => "Expected replacement date " . $expiry->format('d M Y'),
                    'due_info' => $daysLeft < 0 ? "Overdue by " . abs($daysLeft) . " days" : "Due in " . $daysLeft . " days",
                    'target_value' => $expiry->toIso8601String(),
                ];

                if ($daysLeft < 0) {
                    $item['status'] = 'overdue';
                    $overdue[] = $item;
                } elseif ($daysLeft <= 30) {
                    $item['status'] = 'due_soon';
                    $dueSoon[] = $item;
                } else {
                    $item['status'] = 'upcoming';
                    $upcoming[] = $item;
                }
            }
        }

        return response()->json([
            'overdue' => $overdue,
            'due_soon' => $dueSoon,
            'upcoming' => $upcoming,
            'all' => array_merge($overdue, $dueSoon, $upcoming),
        ]);
    }
}
