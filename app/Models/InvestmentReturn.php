<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

class InvestmentReturn extends Model
{
    use Auditable;

    protected $fillable = [
        'investment_id',
        'return_date',
        'amount',
        'period_type',
        'comment'
    ];

    protected $casts = [
        'return_date' => 'date',
        'amount' => 'decimal:2'
    ];

    /**
     * Get the investment that owns the return.
     */
    public function investment(): BelongsTo
    {
        return $this->belongsTo(Investment::class);
    }
}
