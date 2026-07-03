<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\TenantProfile;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Payment::class);

        $user = $request->user();

        if ($user->isTenant()) {
            return Payment::where('tenant_id', $user->tenantProfile?->id)->get();
        }

        return Payment::with('tenant.user', 'unit')->get();
    }

    public function store(Request $request)
    {
        $this->authorize('create', Payment::class);

        $user = $request->user();

        if ($user->isTenant()) {
            $tenant = $user->tenantProfile;
            abort_if(! $tenant, 422, 'No active tenancy found.');

            $data = $request->validate([
                'amount' => ['required', 'numeric', 'min:0.01'],
                'method' => ['sometimes', 'string', 'max:50'],
            ]);

            $payment = Payment::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $tenant->unit_id,
                'owner_id' => $tenant->owner_id,
                'amount' => $data['amount'],
                'date_paid' => now()->toDateString(),
                'method' => $data['method'] ?? 'cash',
                'status' => 'pending',
            ]);

            return response()->json($payment, 201);
        }

        $data = $request->validate([
            'tenant_id' => ['required', 'exists:tenant_profiles,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'date_paid' => ['required', 'date'],
            'method' => ['sometimes', 'string', 'max:50'],
            'status' => ['sometimes', 'in:pending,completed,failed'],
        ]);

        $tenant = TenantProfile::findOrFail($data['tenant_id']);
        $this->authorize('view', $tenant);

        $payment = Payment::create([
            'tenant_id' => $tenant->id,
            'unit_id' => $tenant->unit_id,
            'owner_id' => $tenant->owner_id,
            'amount' => $data['amount'],
            'date_paid' => $data['date_paid'],
            'method' => $data['method'] ?? 'cash',
            'status' => $data['status'] ?? 'completed',
        ]);

        return response()->json($payment, 201);
    }

    public function show(Payment $payment)
    {
        $this->authorize('view', $payment);

        return $payment->load('tenant.user', 'unit');
    }

    public function update(Request $request, Payment $payment)
    {
        $this->authorize('update', $payment);

        $data = $request->validate([
            'amount' => ['sometimes', 'numeric', 'min:0.01'],
            'date_paid' => ['sometimes', 'date'],
            'method' => ['sometimes', 'string', 'max:50'],
            'status' => ['sometimes', 'in:pending,completed,failed'],
        ]);

        $payment->update($data);

        return $payment;
    }

    public function destroy(Payment $payment)
    {
        $this->authorize('delete', $payment);

        $payment->delete();

        return response()->noContent();
    }
}
