@extends('layouts.app')

@section('title', 'Expenses')

@section('header-actions')
    <button class="btn btn-primary" onclick="showAddExpense()">
        <i class="fas fa-plus"></i> Add Expense
    </button>
@endsection

@section('content')
<div class="expenses-section">
    <div class="section-header">
        <h2>Expense Management</h2>
        <div class="expense-summary">
            <div class="summary-item">
                <span class="label">Total Expenses:</span>
                <span class="value" id="totalExpenses">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">This Month:</span>
                <span class="value" id="monthlyExpenses">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Average Daily:</span>
                <span class="value" id="averageDailyExpense">$0</span>
            </div>
        </div>
    </div>

    <div class="expense-filters">
        <div class="filter-group">
            <label for="categoryFilter">Category:</label>
            <select id="categoryFilter" onchange="filterExpenses()">
                <option value="">All Categories</option>
                <option value="Office Rent">Office Rent</option>
                <option value="Marketing">Marketing</option>
                <option value="Utilities">Utilities</option>
                <option value="Travel">Travel</option>
                <option value="Equipment">Equipment</option>
                <option value="Software">Software</option>
                <option value="Legal">Legal</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label for="dateFromFilter">From:</label>
            <input type="date" id="dateFromFilter" onchange="filterExpenses()">
        </div>
        
        <div class="filter-group">
            <label for="dateToFilter">To:</label>
            <input type="date" id="dateToFilter" onchange="filterExpenses()">
        </div>
        
        <button class="btn btn-secondary" onclick="clearExpenseFilters()">Clear Filters</button>
    </div>

    <div class="expenses-list" id="expensesList">
        <!-- Expenses will be populated by JavaScript -->
    </div>
</div>

<!-- Add/Edit Expense Modal -->
<div id="expenseModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="expenseModalTitle">Add Expense</h3>
            <span class="close" onclick="closeModal('expenseModal')">&times;</span>
        </div>
        <form id="expenseForm">
            <input type="hidden" id="expenseId" name="id">
            <input type="hidden" id="editExpenseId" name="edit_id">
            
            <div class="form-group">
                <label for="expenseNotes">Notes</label>
                <textarea id="expenseNotes" name="notes" rows="3"></textarea>
            </div>
            
            <div class="form-group">
                <label for="expenseCategory">Category</label>
                <select id="expenseCategory" name="category" required>
                    <option value="">Select Category</option>
                    <option value="Office Rent">Office Rent</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Travel">Travel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Software">Software</option>
                    <option value="Legal">Legal</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="expenseAmount">Amount ($)</label>
                <input type="number" id="expenseAmount" name="amount" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="expenseDate">Date</label>
                <input type="date" id="expenseDate" name="expense_date" required>
            </div>
            
            <div class="form-group">
                <label for="expenseDescription">Description</label>
                <textarea id="expenseDescription" name="description" rows="3" required></textarea>
            </div>
            
            <div class="form-group">
                <label for="expenseVendor">Vendor/Supplier</label>
                <input type="text" id="expenseVendor" name="vendor">
            </div>
            
            <div class="form-group">
                <label for="expensePaymentMethod">Payment Method</label>
                <select id="paymentMethod" name="payment_method">
                    <option value="">Select Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="expenseReceipt">Receipt Number</label>
                <input type="text" id="expenseReceipt" name="receipt_number">
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('expenseModal')">Cancel</button>
                <button type="submit" id="expenseSubmitBtn" class="btn btn-primary">Save Expense</button>
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
    
    // Set up expense form submission
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', handleExpenseSubmit);
    }
});
</script>
@endpush