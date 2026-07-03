<?php

namespace App\Models;

use App\Models\Scopes\OwnerScope;
use Illuminate\Database\Eloquent\Model;

class MaintenanceRequest extends Model
{
    protected $fillable = ['tenant_id', 'unit_id', 'owner_id', 'issue_description', 'status'];

    protected static function booted(): void
    {
        static::addGlobalScope(new OwnerScope);
    }

    public function tenant()
    {
        return $this->belongsTo(TenantProfile::class, 'tenant_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
