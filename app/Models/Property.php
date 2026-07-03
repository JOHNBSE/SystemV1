<?php

namespace App\Models;

use App\Models\Scopes\OwnerScope;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    protected $fillable = ['owner_id', 'name', 'location', 'description'];

    protected static function booted(): void
    {
        static::addGlobalScope(new OwnerScope);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function units()
    {
        return $this->hasMany(Unit::class);
    }
}
