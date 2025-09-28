<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'description',
        'category',
        'amount',
        'date',
        'payment_method',
        'notes',
        'investment_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    public function investment()
    {
        return $this->belongsTo(Investment::class);
    }
}
