<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InvestmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $investments = Investment::with(['returns', 'expenses'])->get()->map(function ($investment) {
            return [
                'id' => $investment->id,
                'name' => $investment->name,
                'type' => $investment->type,
                'amount' => $investment->amount,
                'purchase_date' => $investment->purchase_date,
                'created_at' => $investment->created_at,
                'updated_at' => $investment->updated_at,
                'totalReturns' => $investment->total_returns,
                'totalExpenses' => $investment->total_expenses,
                'totalCost' => $investment->total_cost,
                'netProfit' => $investment->total_returns - $investment->total_cost,
                'roi' => $investment->total_cost > 0 ? (($investment->total_returns / $investment->total_cost) * 100) : 0,
                'breakEvenMonths' => $investment->break_even_months,
                'monthlyData' => $this->getMonthlyData($investment),
                'breakEvenAnalysis' => $this->calculateBreakEvenAnalysis($investment),
            ];
        });
        
        return response()->json($investments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'purchase_date' => 'required|date',
        ]);

        $investment = Investment::create($validated);

        // Log the action
        AuditLog::create([
            'action' => 'create',
            'table_name' => 'investments',
            'record_id' => $investment->id,
            'new_values' => $investment->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($investment, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Investment $investment): JsonResponse
    {
        $investment->load(['returns', 'expenses']);
        
        $data = [
            'id' => $investment->id,
            'name' => $investment->name,
            'type' => $investment->type,
            'amount' => $investment->amount,
            'purchase_date' => $investment->purchase_date,
            'created_at' => $investment->created_at,
            'updated_at' => $investment->updated_at,
            'totalReturns' => $investment->total_returns,
            'totalExpenses' => $investment->total_expenses,
            'totalCost' => $investment->total_cost,
            'netProfit' => $investment->total_returns - $investment->total_cost,
            'roi' => $investment->total_cost > 0 ? (($investment->total_returns / $investment->total_cost) * 100) : 0,
            'breakEvenMonths' => $investment->break_even_months,
            'returns' => $investment->returns,
            'expenses' => $investment->expenses,
        ];
        
        return response()->json($data);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Investment $investment): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'purchase_date' => 'sometimes|required|date',
        ]);

        $oldValues = $investment->toArray();
        $investment->update($validated);

        // Log the action
        AuditLog::create([
            'action' => 'update',
            'table_name' => 'investments',
            'record_id' => $investment->id,
            'old_values' => $oldValues,
            'new_values' => $investment->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($investment);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Investment $investment): JsonResponse
    {
        $oldValues = $investment->toArray();
        
        // Log the action before deletion
        AuditLog::create([
            'action' => 'delete',
            'table_name' => 'investments',
            'record_id' => $investment->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        $investment->delete();

        return response()->json(['message' => 'Investment deleted successfully']);
    }

    /**
     * Get monthly data for an investment
     */
    private function getMonthlyData(Investment $investment): array
    {
        $monthlyData = [];
        $startDate = $investment->purchase_date;
        $current = $startDate->copy()->startOfMonth();
        $endDate = now()->startOfMonth();

        while ($current->lte($endDate)) {
            $monthKey = $current->format('Y-m');
            
            // Get expenses for this month
            $monthlyExpenses = $investment->expenses()
                ->whereYear('expense_date', $current->year)
                ->whereMonth('expense_date', $current->month)
                ->sum('amount');
            
            // Get returns for this month
            $monthlyReturns = $investment->returns()
                ->whereYear('return_date', $current->year)
                ->whereMonth('return_date', $current->month)
                ->sum('amount');
            
            $monthlyData[] = [
                'month' => $monthKey,
                'expenses' => (float) $monthlyExpenses,
                'revenue' => (float) $monthlyReturns,
            ];
            
            $current->addMonth();
        }
        
        return $monthlyData;
    }

    /**
     * Calculate break-even analysis for an investment
     */
    private function calculateBreakEvenAnalysis(Investment $investment): array
    {
        $totalCosts = $investment->total_cost;
        $totalReturns = $investment->total_returns;
        $monthlyData = $this->getMonthlyData($investment);
        
        $cumulativeReturns = 0;
        $breakEvenMonth = null;
        $breakEvenDays = null;
        $monthlyProgression = [];
        
        foreach ($monthlyData as $index => $month) {
            $cumulativeReturns += $month['revenue'];
            
            $monthlyProgression[] = [
                'month' => $month['month'],
                'cumulative_returns' => $cumulativeReturns,
                'percentage_to_break_even' => $totalCosts > 0 ? min(100, ($cumulativeReturns / $totalCosts) * 100) : 0
            ];
            
            if ($cumulativeReturns >= $totalCosts && !$breakEvenMonth) {
                $breakEvenMonth = $month['month'];
                $breakEvenDays = $investment->purchase_date->diffInDays(
                    $investment->purchase_date->copy()->addMonths($index + 1)
                );
            }
        }
        
        // Calculate overall percentage to break-even
        $percentageToBreakEven = $totalCosts > 0 ? min(100, ($totalReturns / $totalCosts) * 100) : 0;
        
        return [
            'total_costs' => $totalCosts,
            'total_returns' => $totalReturns,
            'remaining_to_break_even' => max(0, $totalCosts - $totalReturns),
            'break_even_month' => $breakEvenMonth,
            'break_even_days' => $breakEvenDays,
            'is_profitable' => $totalReturns >= $totalCosts,
            'percentage_to_break_even' => $percentageToBreakEven,
            'monthly_progression' => $monthlyProgression
        ];
    }
}
