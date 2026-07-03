<?php

namespace Database\Seeders;

use App\Models\OwnerProfile;
use App\Models\Property;
use App\Models\TenantProfile;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Platform Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $owner = User::create([
            'name' => 'Jane Landlord',
            'email' => 'owner@example.com',
            'password' => 'password',
            'role' => 'owner',
        ]);
        OwnerProfile::create(['user_id' => $owner->id, 'company_name' => 'Jane Properties Ltd']);

        $property = Property::create([
            'owner_id' => $owner->id,
            'name' => 'Sunset Apartments',
            'location' => 'Nairobi',
            'description' => 'A block of bedsitters and 1BR units.',
        ]);

        $unit = Unit::create([
            'property_id' => $property->id,
            'owner_id' => $owner->id,
            'unit_number' => 'A1',
            'type' => 'bedsitter',
            'rent_price' => 8000,
            'status' => 'occupied',
        ]);

        Unit::create([
            'property_id' => $property->id,
            'owner_id' => $owner->id,
            'unit_number' => 'A2',
            'type' => '1BR',
            'rent_price' => 15000,
            'status' => 'vacant',
        ]);

        $tenantUser = User::create([
            'name' => 'Tom Tenant',
            'email' => 'tenant@example.com',
            'password' => 'password',
            'role' => 'tenant',
        ]);

        TenantProfile::create([
            'user_id' => $tenantUser->id,
            'owner_id' => $owner->id,
            'unit_id' => $unit->id,
            'lease_start' => now()->subMonths(2),
            'lease_end' => now()->addMonths(10),
        ]);
    }
}
