<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Investment;
use App\Models\Expense;
use App\Models\InvestmentReturn;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class ProjectController extends Controller
{
    /**
     * Display a listing of projects with financial data.
     */
    public function index(): JsonResponse
    {
        $projects = Project::with(['investments', 'expenses', 'investmentReturns'])
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'status' => $project->status,
                    'start_date' => $project->start_date->format('Y-m-d'),
                    'expected_end_date' => $project->expected_end_date?->format('Y-m-d'),
                    'days_running' => $project->days_running,
                    'financial_data' => [
                        'initial_investment' => $project->initial_investment,
                        'total_expenses' => $project->expenses->sum('amount'),
                        'total_revenue' => $project->investmentReturns->sum('amount'),
                        'net_profit' => $project->net_profit,
                        'roi' => round($project->roi, 2),
                        'break_even_point' => $project->break_even_point,
                        'break_even_days' => $project->break_even_days,
                    ],
                    'monthly_data' => $this->getMonthlyData($project),
                    'break_even_analysis' => $this->calculateBreakEvenAnalysis($project)
                ];
            });

        return response()->json($projects);
    }

    /**
     * Store a newly created project.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'expected_end_date' => 'nullable|date|after:start_date',
            'initial_investment' => 'required|numeric|min:0',
        ]);

        $project = Project::create($validated);

        return response()->json($project, 201);
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project): JsonResponse
    {
        $project->load(['investments', 'expenses', 'investmentReturns']);
        
        return response()->json([
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'start_date' => $project->start_date->format('Y-m-d'),
            'expected_end_date' => $project->expected_end_date?->format('Y-m-d'),
            'days_running' => $project->days_running,
            'financial_data' => [
                'initial_investment' => $project->initial_investment,
                'total_expenses' => $project->expenses->sum('amount'),
                'total_revenue' => $project->investmentReturns->sum('amount'),
                'net_profit' => $project->net_profit,
                'roi' => round($project->roi, 2),
                'break_even_point' => $project->break_even_point,
                'break_even_days' => $project->break_even_days,
            ],
            'monthly_data' => $this->getMonthlyData($project),
            'break_even_analysis' => $this->calculateBreakEvenAnalysis($project)
        ]);
    }

    /**
     * Update the specified project.
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,completed,paused',
            'expected_end_date' => 'nullable|date|after:start_date',
            'initial_investment' => 'sometimes|numeric|min:0',
        ]);

        $project->update($validated);

        return response()->json($project);
    }

    /**
     * Remove the specified project.
     */
    public function destroy(Project $project): JsonResponse
    {
        $project->delete();

        return response()->json(null, 204);
    }

    /**
     * Get monthly financial data for a project
     */
    private function getMonthlyData(Project $project): array
    {
        $monthlyData = [];
        $startDate = $project->start_date;
        $endDate = now();
        
        $current = $startDate->copy()->startOfMonth();
        
        while ($current <= $endDate) {
            $monthKey = $current->format('Y-m');
            
            $monthlyExpenses = $project->expenses()
                ->whereRaw('strftime("%Y-%m", date) = ?', [$monthKey])
                ->sum('amount');
                
            $monthlyRevenue = $project->investmentReturns()
                ->whereRaw('strftime("%Y-%m", return_date) = ?', [$monthKey])
                ->sum('amount');
            
            $monthlyData[] = [
                'month' => $current->format('M Y'),
                'expenses' => $monthlyExpenses,
                'revenue' => $monthlyRevenue,
                'net' => $monthlyRevenue - $monthlyExpenses
            ];
            
            $current->addMonth();
        }
        
        return $monthlyData;
    }

    /**
     * Calculate break-even analysis for a project
     */
    private function calculateBreakEvenAnalysis(Project $project): array
    {
        $totalCosts = $project->initial_investment + $project->expenses->sum('amount');
        $totalRevenue = $project->investmentReturns->sum('amount');
        $monthlyData = $this->getMonthlyData($project);
        
        $cumulativeRevenue = 0;
        $breakEvenMonth = null;
        $breakEvenDays = null;
        $monthlyProgression = [];
        
        foreach ($monthlyData as $index => $month) {
            $cumulativeRevenue += $month['revenue'];
            
            $monthlyProgression[] = [
                'month' => $month['month'],
                'cumulative_revenue' => $cumulativeRevenue,
                'percentage_to_break_even' => $totalCosts > 0 ? min(100, ($cumulativeRevenue / $totalCosts) * 100) : 0
            ];
            
            if ($cumulativeRevenue >= $totalCosts && !$breakEvenMonth) {
                $breakEvenMonth = $month['month'];
                $breakEvenDays = $project->start_date->diffInDays(
                    $project->start_date->copy()->addMonths($index + 1)
                );
            }
        }
        
        // Calculate overall percentage to break-even
        $percentageToBreakEven = $totalCosts > 0 ? min(100, ($totalRevenue / $totalCosts) * 100) : 0;
        
        return [
            'total_costs' => $totalCosts,
            'total_revenue' => $totalRevenue,
            'remaining_to_break_even' => max(0, $totalCosts - $totalRevenue),
            'break_even_month' => $breakEvenMonth,
            'break_even_days' => $breakEvenDays,
            'is_profitable' => $totalRevenue >= $totalCosts,
            'percentage_to_break_even' => $percentageToBreakEven,
            'monthly_progression' => $monthlyProgression
        ];
    }
}
