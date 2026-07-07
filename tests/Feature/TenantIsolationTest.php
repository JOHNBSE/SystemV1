<?php

namespace Tests\Feature;

use App\Models\MaintenanceRequest;
use App\Models\Payment;
use App\Models\Property;
use App\Models\TenantProfile;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /** Owner + property + unit + tenant, fully wired, for one landlord. */
    private function makeTenancy(): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $property = Property::create(['owner_id' => $owner->id, 'name' => 'Prop', 'location' => 'Loc']);
        $unit = Unit::create([
            'property_id' => $property->id,
            'owner_id' => $owner->id,
            'unit_number' => '1',
            'type' => 'apartment',
            'rent_price' => 1000,
        ]);
        $tenantUser = User::factory()->create(['role' => 'tenant']);
        $tenantProfile = TenantProfile::create([
            'user_id' => $tenantUser->id,
            'owner_id' => $owner->id,
            'unit_id' => $unit->id,
        ]);

        return compact('owner', 'property', 'unit', 'tenantUser', 'tenantProfile');
    }

    public function test_owner_cannot_list_another_owners_units(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $this->makeTenancy();

        $this->actingAs($bareOwner)->getJson('/api/units')->assertOk()->assertJsonCount(0);
    }

    public function test_owner_cannot_view_another_owners_unit_directly(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $other = $this->makeTenancy();

        $this->actingAs($bareOwner)->getJson("/api/units/{$other['unit']->id}")->assertNotFound();
    }

    public function test_owner_cannot_list_another_owners_tenant_profiles(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $this->makeTenancy();

        $this->actingAs($bareOwner)->getJson('/api/tenants')->assertOk()->assertJsonCount(0);
    }

    public function test_owner_cannot_view_another_owners_tenant_profile_directly(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $other = $this->makeTenancy();

        $this->actingAs($bareOwner)->getJson("/api/tenants/{$other['tenantProfile']->id}")->assertNotFound();
    }

    public function test_owner_cannot_list_another_owners_payments(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $other = $this->makeTenancy();
        Payment::create([
            'tenant_id' => $other['tenantProfile']->id,
            'unit_id' => $other['unit']->id,
            'owner_id' => $other['owner']->id,
            'amount' => 500,
            'date_paid' => now()->toDateString(),
        ]);

        $this->actingAs($bareOwner)->getJson('/api/payments')->assertOk()->assertJsonCount(0);
    }

    public function test_tenant_cannot_view_another_tenants_payment(): void
    {
        $a = $this->makeTenancy();
        $b = $this->makeTenancy();
        $payment = Payment::create([
            'tenant_id' => $b['tenantProfile']->id,
            'unit_id' => $b['unit']->id,
            'owner_id' => $b['owner']->id,
            'amount' => 500,
            'date_paid' => now()->toDateString(),
        ]);

        $this->actingAs($a['tenantUser'])->getJson("/api/payments/{$payment->id}")->assertForbidden();
    }

    public function test_owner_cannot_list_another_owners_maintenance_requests(): void
    {
        $bareOwner = User::factory()->create(['role' => 'owner']);
        $other = $this->makeTenancy();
        MaintenanceRequest::create([
            'tenant_id' => $other['tenantProfile']->id,
            'unit_id' => $other['unit']->id,
            'owner_id' => $other['owner']->id,
            'issue_description' => 'Leaky faucet',
        ]);

        $this->actingAs($bareOwner)->getJson('/api/maintenance-requests')->assertOk()->assertJsonCount(0);
    }

    public function test_tenant_cannot_view_another_tenants_maintenance_request(): void
    {
        $a = $this->makeTenancy();
        $b = $this->makeTenancy();
        $maintenanceRequest = MaintenanceRequest::create([
            'tenant_id' => $b['tenantProfile']->id,
            'unit_id' => $b['unit']->id,
            'owner_id' => $b['owner']->id,
            'issue_description' => 'Broken window',
        ]);

        $this->actingAs($a['tenantUser'])->getJson("/api/maintenance-requests/{$maintenanceRequest->id}")->assertForbidden();
    }
}
