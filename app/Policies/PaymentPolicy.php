<?php

namespace App\Policies;

use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function before(User $user): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isOwner() || $user->isTenant();
    }

    public function view(User $user, Payment $payment): bool
    {
        if ($user->isOwner()) {
            return $payment->owner_id === $user->id;
        }

        return $user->isTenant() && $payment->tenant_id === $user->tenantProfile?->id;
    }

    public function create(User $user): bool
    {
        return $user->isOwner() || $user->isTenant();
    }

    public function update(User $user, Payment $payment): bool
    {
        return $user->isOwner() && $payment->owner_id === $user->id;
    }

    public function delete(User $user, Payment $payment): bool
    {
        return $user->isOwner() && $payment->owner_id === $user->id;
    }
}
