<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;

class MaintenanceRequestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', MaintenanceRequest::class);

        $user = $request->user();

        if ($user->isTenant()) {
            return MaintenanceRequest::where('tenant_id', $user->tenantProfile?->id)->get();
        }

        return MaintenanceRequest::with('tenant.user', 'unit')->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', MaintenanceRequest::class);

        $tenant = $request->user()->tenantProfile;
        abort_if(! $tenant, 422, 'No active tenancy found.');

        $data = $request->validate([
            'issue_description' => ['required', 'string'],
        ]);

        $maintenanceRequest = MaintenanceRequest::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $tenant->unit_id,
            'owner_id' => $tenant->owner_id,
            'issue_description' => $data['issue_description'],
        ])->refresh();

        return response()->json($maintenanceRequest, 201);
    }

    public function show(MaintenanceRequest $maintenanceRequest)
    {
        $this->authorize('view', $maintenanceRequest);

        return $maintenanceRequest->load('tenant.user', 'unit');
    }

    public function update(Request $request, MaintenanceRequest $maintenanceRequest)
    {
        $this->authorize('update', $maintenanceRequest);

        $data = $request->validate([
            'status' => ['required', 'in:open,in_progress,resolved'],
        ]);

        $maintenanceRequest->update($data);

        return $maintenanceRequest;
    }

    public function destroy(MaintenanceRequest $maintenanceRequest)
    {
        $this->authorize('delete', $maintenanceRequest);

        $maintenanceRequest->delete();

        return response()->noContent();
    }
}
