<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TenantProfileController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\MaintenanceRequestController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\UnitController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:15,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:15,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard', DashboardController::class)->middleware('role:owner,tenant');

    // Owner + tenant + admin, each scoped by policy/global-scope/role check inside the controller.
    Route::apiResource('properties', PropertyController::class);
    Route::apiResource('units', UnitController::class);
    // Explicit param name: controller expects $tenantProfile, not the auto-derived {tenant}.
    Route::apiResource('tenants', TenantProfileController::class)
        ->parameters(['tenants' => 'tenant_profile']);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('maintenance-requests', MaintenanceRequestController::class);
    Route::apiResource('messages', MessageController::class);

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/owners', [AdminController::class, 'owners']);
        Route::post('/owners/{owner}/suspend', [AdminController::class, 'suspendOwner']);
        Route::post('/owners/{owner}/activate', [AdminController::class, 'activateOwner']);
        Route::get('/analytics', [AdminController::class, 'analytics'])->name('analytics');
    });
});
