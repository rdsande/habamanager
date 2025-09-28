<?php

namespace App\Models;

use App\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Investment extends Model
{
    use HasFactory, Auditable;

    protected $fillable = [
        'name',
        'type',
        'amount',
        'purchase_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'purchase_date' => 'date',
    ];

    /**
     * Get the returns for the investment.
     */
    public function returns(): HasMany
    {
        return $this->hasMany(InvestmentReturn::class);
    }

    /**
     * Get the total returns for this investment.
     */
    public function getTotalReturnsAttribute(): float
    {
        return $this->returns()->sum('amount');
    }

    /**
     * Get the latest return for this investment.
     */
    public function getLatestReturnAttribute(): ?InvestmentReturn
    {
        return $this->returns()->latest('return_date')->first();
    }

    /**
     * Get the expenses for this investment.
     */
    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    /**
     * Get the total expenses for this investment.
     */
    public function getTotalExpensesAttribute(): float
    {
        return $this->expenses()->sum('amount');
    }

    /**
     * Get the total cost (investment + expenses) for this investment.
     */
    public function getTotalCostAttribute(): float
    {
        return $this->amount + $this->getTotalExpensesAttribute();
    }

    /**
     * Calculate break-even time in months based on average monthly returns.
     */
    public function getBreakEvenMonthsAttribute(): ?float
    {
        $totalCost = $this->getTotalCostAttribute();
        
        if ($totalCost <= 0) {
            return null;
        }

        // Get returns grouped by month
        $monthlyReturns = $this->returns()
            ->selectRaw('strftime("%Y-%m", return_date) as month, SUM(amount) as total')
            ->groupBy('month')
            ->get();

        if ($monthlyReturns->isEmpty()) {
            return null;
        }

        // Calculate average monthly return
        $averageMonthlyReturn = $monthlyReturns->avg('total');
        
        if ($averageMonthlyReturn <= 0) {
            return null;
        }

        // Calculate break-even time in months
        return $totalCost / $averageMonthlyReturn;
    }
}
