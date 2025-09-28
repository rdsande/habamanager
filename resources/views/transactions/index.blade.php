@extends('layouts.app')

@section('title', 'Transactions')

@section('header-actions')
    <button class="btn btn-primary" onclick="showAddTransaction()">
        <i class="fas fa-plus"></i> Add Transaction
    </button>
@endsection

@section('content')
<div class="transactions-section">
    <div class="section-header">
        <h2>Transaction History</h2>
        <div class="transactions-summary">
            <div class="summary-item">
                <span class="label">Total Credits:</span>
                <span class="value" id="totalCredits">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Total Debits:</span>
                <span class="value" id="totalDebits">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Net Flow:</span>
                <span class="value" id="netFlow">$0</span>
            </div>
        </div>
    </div>

    <div class="transaction-filters">
        <div class="filter-group">
            <label for="accountFilter">Account:</label>
            <select id="accountFilter" onchange="filterTransactions()">
                <option value="">All Accounts</option>
                <!-- Options will be populated by JavaScript -->
            </select>
        </div>
        
        <div class="filter-group">
            <label for="typeFilter">Type:</label>
            <select id="typeFilter" onchange="filterTransactions()">
                <option value="">All Types</option>
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="transactionDateFrom">From:</label>
            <input type="date" id="transactionDateFrom" onchange="filterTransactions()">
        </div>
        
        <div class="filter-group">
            <label for="transactionDateTo">To:</label>
            <input type="date" id="transactionDateTo" onchange="filterTransactions()">
        </div>
        
        <button class="btn btn-secondary" onclick="clearTransactionFilters()">Clear Filters</button>
    </div>

    <div class="transactions-list" id="transactionsList">
        <!-- Transactions will be populated by JavaScript -->
    </div>
</div>

<!-- Add/Edit Transaction Modal -->
<div id="transactionModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="transactionModalTitle">Add Transaction</h3>
            <span class="close" onclick="closeModal('transactionModal')">&times;</span>
        </div>
        <form id="transactionForm">
            <input type="hidden" id="transactionId" name="id">
            <input type="hidden" id="editTransactionId" name="edit_id">
            
            <div class="form-group">
                <label for="transactionNotes">Notes</label>
                <textarea id="transactionNotes" name="notes" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label for="transactionAccount">Account</label>
                <select id="transactionAccount" name="account_id" required>
                    <option value="">Select Account</option>
                    <!-- Options will be populated by JavaScript -->
                </select>
            </div>
            
            <div class="form-group">
                <label for="transactionType">Transaction Type</label>
                <select id="transactionType" name="transaction_type" required>
                    <option value="">Select Type</option>
                    <option value="Credit">Credit (Money In)</option>
                    <option value="Debit">Debit (Money Out)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="transactionAmount">Amount ($)</label>
                <input type="number" id="transactionAmount" name="amount" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="transactionDate">Transaction Date</label>
                <input type="date" id="transactionDate" name="transaction_date" required>
            </div>
            
            <div class="form-group">
                <label for="transactionDescription">Description</label>
                <textarea id="transactionDescription" name="description" rows="3" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="transactionCategory">Category</label>
                <select id="transactionCategory" name="category">
                    <option value="">Select Category</option>
                    <option value="Investment">Investment</option>
                    <option value="Revenue">Revenue</option>
                    <option value="Expense">Expense</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Fee">Fee</option>
                    <option value="Interest">Interest</option>
                    <option value="Dividend">Dividend</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="transactionReference">Reference Number</label>
                <input type="text" id="referenceNumber" name="reference_number">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('transactionModal')">Cancel</button>
                <button type="submit" id="transactionSubmitBtn" class="btn btn-primary">Save Transaction</button>
            </div>
        </form>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Load data when page loads
    if (typeof loadData === 'function') {
        loadData();
    }
    
    // Set up transaction form submission
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
});
</script>
@endpush