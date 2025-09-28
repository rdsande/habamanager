<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'type',
        'bank_name',
        'starting_amount',
        'balance',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
        'starting_amount' => 'decimal:2',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
