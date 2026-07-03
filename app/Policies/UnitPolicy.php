<?php

namespace App\Policies;

use App\Models\Unit;
use App\Models\User;

class UnitPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isTenant();
    }

    public function view(User $user, Unit $unit): bool
    {
        if ($user->isOwner()) {
            return $unit->owner_id === $user->id;
        }

        return $user->isTenant() && $user->tenantProfile?->unit_id === $unit->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Unit $unit): bool
    {
        return $user->isOwner() && $unit->owner_id === $user->id;
    }

    public function delete(User $user, Unit $unit): bool
    {
        return $user->isOwner() && $unit->owner_id === $user->id;
    }
}
