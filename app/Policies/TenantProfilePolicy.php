<?php

namespace App\Policies;

use App\Models\TenantProfile;
use App\Models\User;

class TenantProfilePolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function view(User $user, TenantProfile $tenantProfile): bool
    {
        if ($user->isOwner()) {
            return $tenantProfile->owner_id === $user->id;
        }

        return $user->isTenant() && $tenantProfile->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, TenantProfile $tenantProfile): bool
    {
        return $user->isOwner() && $tenantProfile->owner_id === $user->id;
    }

    public function delete(User $user, TenantProfile $tenantProfile): bool
    {
        return $user->isOwner() && $tenantProfile->owner_id === $user->id;
    }
}
