<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\Property;
use App\Models\TenantProfile;
use App\Models\Unit;
use App\Models\User;

class AdminController extends Controller
{
    // Reachable only via the 'role:admin' route middleware.
    public function owners()
    {
        return User::where('role', 'owner')
            ->withCount(['properties', 'tenants'])
            ->with('ownerProfile')
            ->get();
    }

    public function suspendOwner(User $owner)
    {
        abort_unless($owner->role === 'owner', 404);
        $owner->update(['status' => 'suspended']);

        return $owner;
    }

    public function activateOwner(User $owner)
    {
        abort_unless($owner->role === 'owner', 404);
        $owner->update(['status' => 'active']);

        return $owner;
    }

    public function analytics()
    {
        return [
            'owners' => User::where('role', 'owner')->count(),
            'tenants' => User::where('role', 'tenant')->count(),
            'properties' => Property::count(),
            'units' => Unit::count(),
            'occupied_units' => Unit::where('status', 'occupied')->count(),
            'open_maintenance_requests' => MaintenanceRequest::where('status', 'open')->count(),
            'revenue_total' => Payment::where('status', 'completed')->sum('amount'),
            'tenant_profiles' => TenantProfile::count(),
        ];
    }
}
