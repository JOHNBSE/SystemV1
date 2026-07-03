<?php

namespace App\Models;

use App\Models\Scopes\OwnerScope;
use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = ['property_id', 'owner_id', 'unit_number', 'type', 'rent_price', 'status'];

    protected static function booted(): void
    {
        static::addGlobalScope(new OwnerScope);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function tenantProfile()
    {
        return $this->hasOne(TenantProfile::class);
    }
}
