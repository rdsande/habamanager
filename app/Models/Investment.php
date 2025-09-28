<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Investment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'type',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
