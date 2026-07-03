<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isTenant();
    }

    public function view(User $user, Property $property): bool
    {
        if ($user->isOwner()) {
            return $property->owner_id === $user->id;
        }

        return $user->isTenant()
            && $user->tenantProfile?->unit?->property_id === $property->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Property $property): bool
    {
        return $user->isOwner() && $property->owner_id === $user->id;
    }

    public function delete(User $user, Property $property): bool
    {
        return $user->isOwner() && $property->owner_id === $user->id;
    }
}
