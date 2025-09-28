<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    /**
     * Display a listing of audit logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AuditLog::orderBy('created_at', 'desc');

        // Filter by table name if provided
        if ($request->has('table_name')) {
            $query->where('table_name', $request->table_name);
        }

        // Filter by action if provided
        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        // Filter by date range if provided
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Paginate results
        $perPage = $request->get('per_page', 50);
        $auditLogs = $query->paginate($perPage);

        return response()->json($auditLogs);
    }
}
