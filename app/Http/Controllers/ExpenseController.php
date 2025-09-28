<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $expenses = Expense::all();
        return response()->json($expenses);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'payment_method' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $expense = Expense::create($validated);

        // Log the action
        AuditLog::create([
            'action' => 'create',
            'table_name' => 'expenses',
            'record_id' => $expense->id,
            'new_values' => $expense->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($expense, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'description' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'amount' => 'sometimes|required|numeric|min:0',
            'date' => 'sometimes|required|date',
            'payment_method' => 'nullable|string|max:255',
            'notes' => 'nullable|string'
        ]);

        $oldValues = $expense->toArray();
        $expense->update($validated);

        // Log the action
        AuditLog::create([
            'action' => 'update',
            'table_name' => 'expenses',
            'record_id' => $expense->id,
            'old_values' => $oldValues,
            'new_values' => $expense->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($expense);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $oldValues = $expense->toArray();
        
        // Log the action before deletion
        AuditLog::create([
            'action' => 'delete',
            'table_name' => 'expenses',
            'record_id' => $expense->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully']);
    }
}
