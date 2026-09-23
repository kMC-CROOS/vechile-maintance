<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PhonePasswordResetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\FuelController;
use App\Http\Controllers\InsuranceController;
use App\Http\Controllers\OcrController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\ReplacementController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\WarrantyController;
use Illuminate\Support\Facades\Route;

// Public auth routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/google-auth', [AuthController::class, 'googleAuth']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/forgot-password/phone/request', [PhonePasswordResetController::class, 'requestOtp'])
    ->middleware('throttle:otp-request');
Route::post('/forgot-password/phone/verify', [PhonePasswordResetController::class, 'verifyOtp'])
    ->middleware('throttle:otp-verify');
Route::post('/forgot-password/phone/reset', [PhonePasswordResetController::class, 'reset'])
    ->middleware('throttle:5,1');

// Test route
Route::get('/test', function () {
    return response()->json([
        'message' => 'Hello from VehicleCare API!',
        'status' => 'success'
    ]);
});

// Authenticated Sanctum routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);

    // OCR Extraction
    Route::post('/ocr/extract', [OcrController::class, 'extract']);

    // Vehicle CRUD
    Route::get('/vehicles', [VehicleController::class, 'index']);
    Route::post('/vehicles', [VehicleController::class, 'store']);
    Route::get('/vehicles/{id}', [VehicleController::class, 'show']);
    Route::put('/vehicles/{id}', [VehicleController::class, 'update']);
    Route::delete('/vehicles/{id}', [VehicleController::class, 'destroy']);

    // Vehicle Documents (Insurance, Warranty, Tax)
    Route::post('/vehicles/{id}/insurance', [InsuranceController::class, 'store']);
    Route::post('/vehicles/{id}/warranty', [WarrantyController::class, 'store']);
    Route::post('/vehicles/{id}/tax', [TaxController::class, 'store']);

    // Services
    Route::get('/vehicles/{id}/services', [ServiceController::class, 'index']);
    Route::post('/vehicles/{id}/services', [ServiceController::class, 'store']);
    Route::get('/services/{id}', [ServiceController::class, 'show']);
    Route::put('/services/{id}', [ServiceController::class, 'update']);
    Route::delete('/services/{id}', [ServiceController::class, 'destroy']);

    // Fuel
    Route::get('/vehicles/{id}/fuel', [FuelController::class, 'index']);
    Route::post('/vehicles/{id}/fuel', [FuelController::class, 'store']);
    Route::delete('/fuel/{id}', [FuelController::class, 'destroy']);

    // Replacements
    Route::get('/vehicles/{id}/replacements', [ReplacementController::class, 'index']);
    Route::post('/vehicles/{id}/replacements', [ReplacementController::class, 'store']);

    // Expenses
    Route::get('/vehicles/{id}/expenses', [ExpenseController::class, 'index']);
    Route::post('/vehicles/{id}/expenses', [ExpenseController::class, 'store']);

    // Reminders
    Route::get('/vehicles/{id}/reminders', [ReminderController::class, 'index']);

    // Dashboard
    Route::get('/vehicles/{id}/dashboard', [DashboardController::class, 'show']);

    // Analytics
    Route::get('/vehicles/{id}/analytics', [AnalyticsController::class, 'show']);
});
