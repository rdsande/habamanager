<?php

namespace App\Http\Controllers;

use App\Models\Investment;
use App\Models\InvestmentReturn;
use App\Models\Expense;
use App\Models\Account;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Display analytics overview.
     */
    public function index(): JsonResponse
    {
        $data = [
            'total_investments' => Investment::sum('current_value') ?: Investment::sum('amount'),
            'total_expenses' => Expense::sum('amount'),
            'total_accounts' => Account::count(),
            'total_balance' => Account::sum('balance'),
            'recent_transactions' => Transaction::with('account')
                ->orderBy('date', 'desc')
                ->limit(10)
                ->get()
        ];

        return response()->json($data);
    }

    /**
     * Get dashboard data.
     */
    public function dashboard(): JsonResponse
    {
        $currentMonth = now()->format('Y-m');
        $lastMonth = now()->subMonth()->format('Y-m');

        $data = [
            'summary' => [
                'total_balance' => Account::sum('balance'),
                'total_investments' => Investment::sum('current_value') ?: Investment::sum('amount'),
                'monthly_expenses' => Expense::whereRaw('strftime("%Y-%m", date) = ?', [$currentMonth])->sum('amount'),
                'monthly_income' => Transaction::where('type', 'income')
                    ->whereRaw('strftime("%Y-%m", date) = ?', [$currentMonth])
                    ->sum('amount') + 
                    InvestmentReturn::whereRaw('strftime("%Y-%m", return_date) = ?', [$currentMonth])
                    ->sum('amount')
            ],
            'expense_categories' => Expense::select('category', DB::raw('SUM(amount) as total'))
                ->whereRaw('strftime("%Y-%m", date) = ?', [$currentMonth])
                ->groupBy('category')
                ->get(),
            'investment_types' => Investment::select('type', DB::raw('SUM(COALESCE(current_value, amount)) as total'))
                ->groupBy('type')
                ->get(),
            'monthly_comparison' => [
                'current_month' => [
                    'expenses' => Expense::whereRaw('strftime("%Y-%m", date) = ?', [$currentMonth])->sum('amount'),
                    'income' => Transaction::where('type', 'income')
                        ->whereRaw('strftime("%Y-%m", date) = ?', [$currentMonth])
                        ->sum('amount') + 
                        InvestmentReturn::whereRaw('strftime("%Y-%m", return_date) = ?', [$currentMonth])
                        ->sum('amount')
                ],
                'last_month' => [
                    'expenses' => Expense::whereRaw('strftime("%Y-%m", date) = ?', [$lastMonth])->sum('amount'),
                    'income' => Transaction::where('type', 'income')
                        ->whereRaw('strftime("%Y-%m", date) = ?', [$lastMonth])
                        ->sum('amount') + 
                        InvestmentReturn::whereRaw('strftime("%Y-%m", return_date) = ?', [$lastMonth])
                        ->sum('amount')
                ]
            ],
            'recent_activities' => [
                'expenses' => Expense::orderBy('date', 'desc')->limit(5)->get(),
                'investments' => Investment::orderBy('created_at', 'desc')->limit(5)->get(),
                'transactions' => Transaction::with('account')->orderBy('date', 'desc')->limit(5)->get()
            ]
        ];

        return response()->json($data);
    }

    /**
     * Get performance analytics.
     */
    public function performance(): JsonResponse
    {
        $data = [
            'investment_performance' => Investment::select(
                'type',
                DB::raw('SUM(amount) as invested'),
                DB::raw('SUM(COALESCE(current_value, amount)) as current_value'),
                DB::raw('SUM(COALESCE(current_value, amount)) - SUM(amount) as profit_loss')
            )->groupBy('type')->get(),
            'monthly_trends' => [
                'expenses' => Expense::select(
                    DB::raw('strftime("%Y-%m", date) as month'),
                    DB::raw('SUM(amount) as total')
                )->groupBy(DB::raw('strftime("%Y-%m", date)'))
                ->orderBy('month', 'desc')
                ->limit(12)
                ->get(),
                'income' => Transaction::where('type', 'income')
                    ->select(
                        DB::raw('strftime("%Y-%m", date) as month'),
                        DB::raw('SUM(amount) as total')
                    )->groupBy(DB::raw('strftime("%Y-%m", date)'))
                    ->orderBy('month', 'desc')
                    ->limit(12)
                    ->get()
            ],
            'account_distribution' => Account::where('is_active', true)
                ->select('type', DB::raw('SUM(balance) as total'))
                ->groupBy('type')
                ->get()
        ];

        return response()->json($data);
    }
}
