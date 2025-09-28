@extends('layouts.app')

@section('title', 'Investments')

@section('header-actions')
    <button class="btn btn-primary" onclick="showAddInvestment()">
        <i class="fas fa-plus"></i> Add Investment
    </button>
@endsection

@section('content')
<div class="investments-section">
    <div class="section-header">
        <h2>Investment Portfolio</h2>
        <div class="portfolio-summary">
            <div class="summary-item">
                <span class="label">Total Portfolio Value:</span>
                <span class="value" id="totalPortfolioValue">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Total Returns:</span>
                <span class="value" id="totalReturns">$0</span>
            </div>
            <div class="summary-item">
                <span class="label">Average ROI:</span>
                <span class="value" id="averageROI">0%</span>
            </div>
        </div>
    </div>

    <div class="investments-list" id="investmentsList">
        <!-- Investments will be populated by JavaScript -->
    </div>
</div>

<!-- Add/Edit Investment Modal -->
<div id="investmentModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="investmentModalTitle">Add Investment</h3>
            <span class="close" onclick="closeModal('investmentModal')">&times;</span>
        </div>
        <form id="investmentForm">
            <input type="hidden" id="investmentId" name="id">
            <input type="hidden" id="editInvestmentId" name="edit_id">
            
            <div class="form-group">
                <label for="businessName">Business Name</label>
                <input type="text" id="businessName" name="business_name" required>
            </div>
            
            <div class="form-group">
                <label for="investmentType">Business Type</label>
                <select id="businessType" name="investment_type" required>
                    <option value="">Select Type</option>
                    <option value="3wheeler">3Wheeler</option>
                    <option value="shop">Shop</option>
                    <option value="extra">Extra</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="investmentAmount">Investment Amount (TSh)</label>
                <input type="number" id="investmentAmount" name="amount" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="startDate">Purchase Date</label>
                <input type="date" id="startDate" name="purchase_date" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('investmentModal')">Cancel</button>
                <button type="submit" id="investmentSubmitBtn" class="btn btn-primary">Save Investment</button>
            </div>
        </form>
    </div>
</div>

<!-- Investment Details Modal -->
<div id="investmentDetailsModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Investment Details</h3>
            <span class="close" onclick="closeModal('investmentDetailsModal')">&times;</span>
        </div>
        <div id="investmentDetailsContent">
            <!-- Details will be populated by JavaScript -->
        </div>
        
        <!-- Returns Section -->
        <div class="returns-section">
            <div class="section-header">
                <h4>Investment Returns</h4>
                <button class="btn btn-sm btn-primary" onclick="showAddReturn()">
                    <i class="fas fa-plus"></i> Add Return
                </button>
            </div>
            <div id="returnsList" class="returns-list">
                <!-- Returns will be populated by JavaScript -->
            </div>
        </div>
    </div>
</div>

<!-- Add/Edit Return Modal -->
<div id="returnModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h3 id="returnModalTitle">Add Return</h3>
            <span class="close" onclick="closeModal('returnModal')">&times;</span>
        </div>
        <form id="returnForm">
            <input type="hidden" id="returnId" name="id">
            <input type="hidden" id="returnInvestmentId" name="investment_id">
            
            <div class="form-group">
                <label for="returnDate">Date</label>
                <input type="date" id="returnDate" name="return_date" required>
            </div>
            
            <div class="form-group">
                <label for="returnAmount">Amount (TSh)</label>
                <input type="number" id="returnAmount" name="amount" step="0.01" min="0" required>
            </div>
            
            <div class="form-group">
                <label for="periodType">Period Type</label>
                <select id="periodType" name="period_type" required>
                    <option value="">Select Period</option>
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="returnComment">Comment</label>
                <textarea id="returnComment" name="comment" rows="3" placeholder="Optional comment about this return"></textarea>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal('returnModal')">Cancel</button>
                <button type="submit" id="returnSubmitBtn" class="btn btn-primary">Save Return</button>
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
    
    // Event listeners are handled in the main script.js file
});
</script>
@endpush