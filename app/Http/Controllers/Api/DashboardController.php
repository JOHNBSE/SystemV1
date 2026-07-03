<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\Property;
use App\Models\TenantProfile;
use App\Models\Unit;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $user = $request->user();

        // Admins use GET /api/admin/analytics instead.
        return match ($user->role) {
            'owner' => $this->ownerDashboard($user),
            'tenant' => $this->tenantDashboard($user),
        };
    }

    private function ownerDashboard($owner): array
    {
        $units = Unit::count();
        $occupied = Unit::where('status', 'occupied')->count();

        return [
            'properties' => Property::count(),
            'units' => $units,
            'occupied_units' => $occupied,
            'vacant_units' => $units - $occupied,
            'occupancy_rate' => $units ? round($occupied / $units * 100, 1) : 0,
            'tenants' => TenantProfile::where('status', 'active')->count(),
            'income_this_month' => Payment::where('status', 'completed')
                ->whereMonth('date_paid', now()->month)
                ->whereYear('date_paid', now()->year)
                ->sum('amount'),
            'pending_maintenance' => MaintenanceRequest::whereIn('status', ['open', 'in_progress'])->count(),
        ];
    }

    private function tenantDashboard($tenantUser): array
    {
        $tenant = $tenantUser->tenantProfile()->with('unit.property')->first();

        if (! $tenant) {
            return ['message' => 'No active tenancy.'];
        }

        return [
            'unit' => $tenant->unit,
            'property' => $tenant->unit?->property,
            'lease_start' => $tenant->lease_start,
            'lease_end' => $tenant->lease_end,
            'rent_price' => $tenant->unit?->rent_price,
            'total_paid' => $tenant->payments()->where('status', 'completed')->sum('amount'),
            'last_payment' => $tenant->payments()->latest('date_paid')->first(),
            'open_maintenance_requests' => $tenant->maintenanceRequests()->whereIn('status', ['open', 'in_progress'])->count(),
        ];
    }
}
