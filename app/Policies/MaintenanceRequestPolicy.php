<?php

namespace App\Policies;

use App\Models\MaintenanceRequest;
use App\Models\User;

class MaintenanceRequestPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isTenant();
    }

    public function view(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($user->isOwner()) {
            return $maintenanceRequest->owner_id === $user->id;
        }

        return $user->isTenant() && $maintenanceRequest->tenant_id === $user->tenantProfile?->id;
    }

    public function create(User $user): bool
    {
        return $user->isTenant();
    }

    public function update(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        return $user->isOwner() && $maintenanceRequest->owner_id === $user->id;
    }

    public function delete(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        return $user->isOwner() && $maintenanceRequest->owner_id === $user->id;
    }
}
