<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Dashboard route
Route::get('/', function () {
    return view('dashboard');
})->name('dashboard');

Route::get('/dashboard', function () {
    return view('dashboard');
})->name('dashboard');

// Investments routes
Route::get('/investments', function () {
    return view('investments.index');
})->name('investments.index');

// Expenses routes
Route::get('/expenses', function () {
    return view('expenses.index');
})->name('expenses.index');

// Accounts routes
Route::get('/accounts', function () {
    return view('accounts.index');
})->name('accounts.index');

// Transactions routes
Route::get('/transactions', function () {
    return view('transactions.index');
})->name('transactions.index');

// Audit logs routes
Route::get('/audit-logs', function () {
    return view('audit.index');
})->name('audit.index');
