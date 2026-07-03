<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantProfile;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantProfileController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', TenantProfile::class);

        return TenantProfile::with('user', 'unit.property')->get();
    }

    // Owner-only: creates the tenant's user account and profile in one step,
    // then occupies the unit. Tenants don't self-register.
    public function store(Request $request)
    {
        $this->authorize('create', TenantProfile::class);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'unit_id' => ['required', 'exists:units,id'],
            'lease_start' => ['nullable', 'date'],
            'lease_end' => ['nullable', 'date', 'after_or_equal:lease_start'],
        ]);

        $unit = Unit::findOrFail($data['unit_id']);
        $this->authorize('update', $unit);

        $owner = $request->user();
        $password = Str::password(12);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $password,
            'role' => 'tenant',
        ]);

        $tenant = TenantProfile::create([
            'user_id' => $user->id,
            'owner_id' => $owner->id,
            'unit_id' => $unit->id,
            'lease_start' => $data['lease_start'] ?? null,
            'lease_end' => $data['lease_end'] ?? null,
        ]);

        $unit->update(['status' => 'occupied']);

        return response()->json([
            'tenant' => $tenant->refresh()->load('user', 'unit'),
            'temporary_password' => $password,
        ], 201);
    }

    public function show(TenantProfile $tenantProfile)
    {
        $this->authorize('view', $tenantProfile);

        return $tenantProfile->load('user', 'unit.property', 'payments', 'maintenanceRequests');
    }

    public function update(Request $request, TenantProfile $tenantProfile)
    {
        $this->authorize('update', $tenantProfile);

        $data = $request->validate([
            'unit_id' => ['sometimes', 'exists:units,id'],
            'lease_start' => ['nullable', 'date'],
            'lease_end' => ['nullable', 'date', 'after_or_equal:lease_start'],
            'status' => ['sometimes', 'in:active,ended'],
        ]);

        if (isset($data['unit_id']) && $data['unit_id'] !== $tenantProfile->unit_id) {
            $this->authorize('update', Unit::findOrFail($data['unit_id']));
            Unit::whereKey($data['unit_id'])->update(['status' => 'occupied']);
            $tenantProfile->unit()->update(['status' => 'vacant']);
        }

        $tenantProfile->update($data);

        return $tenantProfile;
    }

    public function destroy(TenantProfile $tenantProfile)
    {
        $this->authorize('delete', $tenantProfile);

        $tenantProfile->unit()->update(['status' => 'vacant']);
        $tenantProfile->user()->delete();
        $tenantProfile->delete();

        return response()->noContent();
    }
}
