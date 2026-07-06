<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_cannot_list_another_owners_properties(): void
    {
        $ownerA = User::factory()->create(['role' => 'owner']);
        $ownerB = User::factory()->create(['role' => 'owner']);
        Property::create(['owner_id' => $ownerB->id, 'name' => 'B House', 'location' => 'Elsewhere']);

        $response = $this->actingAs($ownerA)->getJson('/api/properties');

        $response->assertOk()->assertJsonCount(0);
    }

    public function test_owner_cannot_view_another_owners_property_directly(): void
    {
        $ownerA = User::factory()->create(['role' => 'owner']);
        $ownerB = User::factory()->create(['role' => 'owner']);
        $property = Property::create(['owner_id' => $ownerB->id, 'name' => 'B House', 'location' => 'Elsewhere']);

        $response = $this->actingAs($ownerA)->getJson("/api/properties/{$property->id}");

        $response->assertNotFound();
    }

    public function test_guest_cannot_list_properties(): void
    {
        $this->getJson('/api/properties')->assertUnauthorized();
    }
}
