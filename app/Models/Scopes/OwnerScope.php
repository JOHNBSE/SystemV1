<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

// ponytail: row-level tenancy via owner_id + this scope, instead of schema-per-tenant
class OwnerScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        $user = auth()->user();

        if ($user && $user->role === 'owner') {
            $builder->where($model->getTable().'.owner_id', $user->id);
        }
    }
}
