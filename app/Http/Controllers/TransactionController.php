<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TransactionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $transactions = Transaction::with('account')->get();
        return response()->json($transactions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|string|in:income,expense,transfer',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'category' => 'nullable|string|max:255',
            'account_id' => 'required|exists:accounts,id',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $transaction = Transaction::create($validated);

        // Log the action
        AuditLog::create([
            'action' => 'create',
            'table_name' => 'transactions',
            'record_id' => $transaction->id,
            'new_values' => $transaction->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($transaction->load('account'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Transaction $transaction): JsonResponse
    {
        $transaction->load('account');
        return response()->json($transaction);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|required|string|in:income,expense,transfer',
            'description' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'category' => 'nullable|string|max:255',
            'account_id' => 'sometimes|required|exists:accounts,id',
            'reference_number' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $oldValues = $transaction->toArray();
        $transaction->update($validated);

        // Log the action
        AuditLog::create([
            'action' => 'update',
            'table_name' => 'transactions',
            'record_id' => $transaction->id,
            'old_values' => $oldValues,
            'new_values' => $transaction->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($transaction->load('account'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Transaction $transaction): JsonResponse
    {
        $oldValues = $transaction->toArray();
        
        // Log the action before deletion
        AuditLog::create([
            'action' => 'delete',
            'table_name' => 'transactions',
            'record_id' => $transaction->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully']);
    }
}
