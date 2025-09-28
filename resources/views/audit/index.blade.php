@extends('layouts.app')

@section('title', 'Audit Logs')

@section('content')
<div class="audit-section">
    <div class="section-header">
        <h2>Audit Logs</h2>
        <p class="section-description">Track all system activities and changes</p>
    </div>

    <div class="audit-filters">
        <div class="filter-group">
            <label for="tableFilter">Table:</label>
            <select id="tableFilter" onchange="filterAuditLogs()">
                <option value="">All Tables</option>
                <option value="investments">Investments</option>
                <option value="expenses">Expenses</option>
                <option value="accounts">Accounts</option>
                <option value="transactions">Transactions</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="actionFilter">Action:</label>
            <select id="actionFilter" onchange="filterAuditLogs()">
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="deleted">Deleted</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="auditDateFrom">From:</label>
            <input type="date" id="auditDateFrom" onchange="filterAuditLogs()">
        </div>
        
        <div class="filter-group">
            <label for="auditDateTo">To:</label>
            <input type="date" id="auditDateTo" onchange="filterAuditLogs()">
        </div>
        
        <button class="btn btn-secondary" onclick="clearAuditFilters()">Clear Filters</button>
        <button class="btn btn-primary" onclick="refreshAuditLogs()">
            <i class="fas fa-sync-alt"></i> Refresh
        </button>
    </div>

    <div class="audit-stats">
        <div class="stat-item">
            <span class="label">Total Logs:</span>
            <span class="value" id="totalAuditLogs">0</span>
        </div>
        <div class="stat-item">
            <span class="label">Today's Activities:</span>
            <span class="value" id="todayActivities">0</span>
        </div>
        <div class="stat-item">
            <span class="label">Most Active Table:</span>
            <span class="value" id="mostActiveTable">-</span>
        </div>
    </div>

    <div class="audit-logs-container">
        <div class="audit-logs-list" id="auditLogsList">
            <!-- Audit logs will be populated by JavaScript -->
        </div>
        
        <div class="pagination-container" id="auditPagination">
            <!-- Pagination will be populated by JavaScript -->
        </div>
    </div>
</div>

<!-- Audit Log Details Modal -->
<div id="auditDetailsModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Audit Log Details</h3>
            <span class="close" onclick="closeAuditDetailsModal()">&times;</span>
        </div>
        <div id="auditDetailsContent">
            <!-- Details will be populated by JavaScript -->
        </div>
    </div>
</div>
@endsection

@push('styles')
<style>
.audit-section {
    padding: 20px;
}

.audit-filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: end;
}

.filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.filter-group label {
    font-weight: 500;
    color: #374151;
    font-size: 14px;
}

.filter-group select,
.filter-group input {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    min-width: 150px;
}

.audit-stats {
    display: flex;
    gap: 30px;
    margin-bottom: 25px;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.stat-item .label {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

.stat-item .value {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
}

.audit-logs-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.audit-logs-list {
    max-height: 600px;
    overflow-y: auto;
}

.audit-log-item {
    display: flex;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.2s;
}

.audit-log-item:hover {
    background-color: #f9fafb;
}

.audit-log-item:last-child {
    border-bottom: none;
}

.audit-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 16px;
    color: white;
}

.audit-icon.created {
    background-color: #10b981;
}

.audit-icon.updated {
    background-color: #f59e0b;
}

.audit-icon.deleted {
    background-color: #ef4444;
}

.audit-content {
    flex: 1;
}

.audit-action {
    font-weight: 600;
    color: #111827;
    margin-bottom: 4px;
}

.audit-details {
    font-size: 14px;
    color: #6b7280;
    margin-bottom: 4px;
}

.audit-timestamp {
    font-size: 12px;
    color: #9ca3af;
}

.pagination-container {
    padding: 15px 20px;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
    gap: 10px;
}

.pagination-btn {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.pagination-btn:hover {
    background-color: #f3f4f6;
}

.pagination-btn.active {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #6b7280;
}

.empty-state i {
    font-size: 48px;
    margin-bottom: 15px;
    color: #d1d5db;
}

.loading-state {
    text-align: center;
    padding: 40px 20px;
    color: #6b7280;
}

.loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid #f3f4f6;
    border-radius: 50%;
    border-top-color: #3b82f6;
    animation: spin 1s ease-in-out infinite;
    margin-right: 10px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
@endpush

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load audit logs when page loads
    if (typeof loadAuditLogs === 'function') {
        loadAuditLogs();
    }
});
</script>
@endpush