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
        $investments = Investment::all();
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
        return response()->json($investment);
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
}
