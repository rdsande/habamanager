<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        $accounts = Account::with('transactions')->get();
        return response()->json($accounts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'starting_amount' => 'required|numeric',
            'balance' => 'required|numeric'
        ]);

        $account = Account::create($validated);

        // Log the action
        AuditLog::create([
            'action' => 'create',
            'table_name' => 'accounts',
            'record_id' => $account->id,
            'new_values' => $account->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($account, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Account $account): JsonResponse
    {
        $account->load('transactions');
        return response()->json($account);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Account $account): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'starting_amount' => 'sometimes|required|numeric',
            'balance' => 'sometimes|required|numeric'
        ]);

        $oldValues = $account->toArray();
        $account->update($validated);

        // Log the action
        AuditLog::create([
            'action' => 'update',
            'table_name' => 'accounts',
            'record_id' => $account->id,
            'old_values' => $oldValues,
            'new_values' => $account->toArray(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        return response()->json($account);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Account $account): JsonResponse
    {
        $oldValues = $account->toArray();
        
        // Log the action before deletion
        AuditLog::create([
            'action' => 'delete',
            'table_name' => 'accounts',
            'record_id' => $account->id,
            'old_values' => $oldValues,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        $account->delete();

        return response()->json(['message' => 'Account deleted successfully']);
    }
}
