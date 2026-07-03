<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OwnerProfile extends Model
{
    protected $fillable = ['user_id', 'company_name', 'phone'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
