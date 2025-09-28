<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'type',
        'description',
        'amount',
        'date',
        'category',
        'account_id',
        'reference_number',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
