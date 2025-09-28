<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Project extends Model
{
    protected $fillable = [
        'name',
        'description',
        'status',
        'start_date',
        'expected_end_date',
        'initial_investment',
        'total_expenses',
        'total_revenue',
        'break_even_point',
        'break_even_days'
    ];

    protected $casts = [
        'start_date' => 'date',
        'expected_end_date' => 'date',
        'initial_investment' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'total_revenue' => 'decimal:2',
        'break_even_point' => 'decimal:2'
    ];

    public function investments(): HasMany
    {
        return $this->hasMany(Investment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function investmentReturns(): HasManyThrough
    {
        return $this->hasManyThrough(InvestmentReturn::class, Investment::class);
    }

    // Calculate ROI for the project
    public function getRoiAttribute()
    {
        if ($this->initial_investment > 0) {
            return (($this->total_revenue - $this->total_expenses - $this->initial_investment) / $this->initial_investment) * 100;
        }
        return 0;
    }

    // Calculate net profit
    public function getNetProfitAttribute()
    {
        return $this->total_revenue - $this->total_expenses - $this->initial_investment;
    }

    // Calculate days since project started
    public function getDaysRunningAttribute()
    {
        return $this->start_date->diffInDays(now());
    }
}
