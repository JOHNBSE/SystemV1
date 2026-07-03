<?php

namespace App\Models;

use App\Models\Scopes\OwnerScope;
use Illuminate\Database\Eloquent\Model;

class TenantProfile extends Model
{
    protected $fillable = ['user_id', 'owner_id', 'unit_id', 'lease_start', 'lease_end', 'status'];

    protected function casts(): array
    {
        return [
            'lease_start' => 'date',
            'lease_end' => 'date',
        ];
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new OwnerScope);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'tenant_id');
    }

    public function maintenanceRequests()
    {
        return $this->hasMany(MaintenanceRequest::class, 'tenant_id');
    }
}
