<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvestmentReturn;
use App\Models\Investment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class InvestmentReturnController extends Controller
{
    /**
     * Display a listing of returns for a specific investment.
     */
    public function index(Request $request): JsonResponse
    {
        $investmentId = $request->query('investment_id');
        
        if ($investmentId) {
            $returns = InvestmentReturn::where('investment_id', $investmentId)
                ->with('investment')
                ->orderBy('return_date', 'desc')
                ->get();
        } else {
            $returns = InvestmentReturn::with('investment')
                ->orderBy('return_date', 'desc')
                ->get();
        }

        return response()->json($returns);
    }

    /**
     * Store a newly created return in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'investment_id' => 'required|exists:investments,id',
                'return_date' => 'required|date',
                'amount' => 'required|numeric|min:0',
                'period_type' => 'required|in:day,week',
                'comment' => 'nullable|string|max:1000'
            ]);

            $return = InvestmentReturn::create($validated);
            $return->load('investment');

            return response()->json([
                'message' => 'Return added successfully',
                'return' => $return
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified return.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $return = InvestmentReturn::with('investment')->findOrFail($id);
            return response()->json($return);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Return not found'
            ], 404);
        }
    }

    /**
     * Update the specified return in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $return = InvestmentReturn::findOrFail($id);

            $validated = $request->validate([
                'return_date' => 'sometimes|required|date',
                'amount' => 'sometimes|required|numeric|min:0',
                'period_type' => 'sometimes|required|in:day,week',
                'comment' => 'nullable|string|max:1000'
            ]);

            $return->update($validated);
            $return->load('investment');

            return response()->json([
                'message' => 'Return updated successfully',
                'return' => $return
            ]);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update return',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified return from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $return = InvestmentReturn::findOrFail($id);
            $return->delete();

            return response()->json([
                'message' => 'Return deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete return',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
