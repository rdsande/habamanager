<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\InvestmentController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AuditLogController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Investment routes
Route::apiResource('investments', InvestmentController::class)->names([
    'index' => 'api.investments.index',
    'store' => 'api.investments.store',
    'show' => 'api.investments.show',
    'update' => 'api.investments.update',
    'destroy' => 'api.investments.destroy'
]);

// Expense routes
Route::apiResource('expenses', ExpenseController::class)->names([
    'index' => 'api.expenses.index',
    'store' => 'api.expenses.store',
    'show' => 'api.expenses.show',
    'update' => 'api.expenses.update',
    'destroy' => 'api.expenses.destroy'
]);

// Account routes
Route::apiResource('accounts', AccountController::class)->names([
    'index' => 'api.accounts.index',
    'store' => 'api.accounts.store',
    'show' => 'api.accounts.show',
    'update' => 'api.accounts.update',
    'destroy' => 'api.accounts.destroy'
]);

// Transaction routes
Route::apiResource('transactions', TransactionController::class)->names([
    'index' => 'api.transactions.index',
    'store' => 'api.transactions.store',
    'show' => 'api.transactions.show',
    'update' => 'api.transactions.update',
    'destroy' => 'api.transactions.destroy'
]);

// Analytics routes
Route::get('analytics', [AnalyticsController::class, 'index']);
Route::get('analytics/dashboard', [AnalyticsController::class, 'dashboard']);
Route::get('analytics/performance', [AnalyticsController::class, 'performance']);

// Audit log routes
Route::get('audit-logs', [AuditLogController::class, 'index']);