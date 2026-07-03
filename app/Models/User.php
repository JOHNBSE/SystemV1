<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    public function isTenant(): bool
    {
        return $this->role === 'tenant';
    }

    public function ownerProfile()
    {
        return $this->hasOne(OwnerProfile::class);
    }

    public function tenantProfile()
    {
        return $this->hasOne(TenantProfile::class);
    }

    public function properties()
    {
        return $this->hasMany(Property::class, 'owner_id');
    }

    public function tenants()
    {
        return $this->hasMany(TenantProfile::class, 'owner_id');
    }
}
