@extends('layouts.app')

@section('title', 'Bank Accounts')

@section('header-actions')
    <button class="btn btn-primary" onclick="showAddAccount()">
        <i class="fas fa-plus"></i> Add Account
    </button>
@endsection

@section('content')
<div class="accounts-section">
    <div class="section-header">
        <h2>Bank Accounts Overview</h2>
        <div class="accounts-summary">
            <div class="summary-item">
                <span class="label">Total Balance:</span>
                <span class="value" id="totalAccountBalance">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Active Accounts:</span>
                <span class="value" id="activeAccountsCount">0</span>
            </div>
            <div class="summary-item">
                <span class="label">Largest Balance:</span>
                <span class="value" id="largestAccountBalance">$0</span>
            </div>
        </div>
    </div>

    <div class="accounts-grid" id="accountsGrid">
        <!-- Accounts will be populated by JavaScript -->
    </div>
</div>

<!-- Add/Edit Account Modal -->
<div id="accountModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="accountModalTitle">Add Bank Account</h3>
            <span class="close" onclick="closeModal('accountModal')">&times;</span>
        </div>
        <form id="accountForm">
            <input type="hidden" id="accountId" name="id">
            <input type="hidden" id="editAccountId" name="edit_id">
            
            <div class="form-group">
                <label for="accountName">Account Name</label>
                <input type="text" id="accountName" name="account_name" required>
            </div>
            
            <div class="form-group">
                <label for="bankName">Bank Name</label>
                <input type="text" id="bankName" name="bank_name" required>
            </div>
            
            <div class="form-group">
                <label for="accountType">Account Type</label>
                <select id="accountType" name="account_type" required>
                    <option value="">Select Type</option>
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Investment">Investment</option>
                    <option value="Money Market">Money Market</option>
                    <option value="Certificate of Deposit">Certificate of Deposit</option>
                    <option value="Business">Business</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="startingAmount">Starting Amount (TSh)</label>
                <input type="number" id="startingAmount" name="starting_amount" step="0.01" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('accountModal')">Cancel</button>
                <button type="submit" class="btn btn-primary" id="accountSubmitBtn">Save Account</button>
            </div>
        </form>
    </div>
</div>

<!-- Account Details Modal -->
<div id="accountDetailsModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Account Details</h3>
            <span class="close" onclick="closeModal('accountDetailsModal')">&times;</span>
        </div>
        <div id="accountDetailsContent">
            <!-- Details will be populated by JavaScript -->
        </div>
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
    
    // Event listeners are handled in the main script.js file
});
</script>
@endpush