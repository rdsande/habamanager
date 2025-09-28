@extends('layouts.app')

@section('title', 'Dashboard - SMM')
@section('page-title', 'Dashboard')

@section('content')
<div class="dashboard-grid">
    <!-- Stats Cards -->
    <div class="stats-row">
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon wallet"><i class="fas fa-wallet"></i></div>
                <div class="stat-trend" id="startingBalanceTrend">--</div>
            </div>
            <div class="stat-info">
                <h3>Starting Balance</h3>
                <p class="stat-value" id="startingBalance">TSh 0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon wallet"><i class="fas fa-wallet"></i></div>
                <div class="stat-trend up">+12%</div>
            </div>
            <div class="stat-info">
                <h3>Total Invested</h3>
                <p class="stat-value" id="totalPortfolio">TSh 0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon investments"><i class="fas fa-chart-line"></i></div>
                <div class="stat-trend up">+8%</div>
            </div>
            <div class="stat-info">
                <h3>Active Investments</h3>
                <p class="stat-value" id="activeInvestments">0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon expenses"><i class="fas fa-money-bill-wave"></i></div>
                <div class="stat-trend down">-5%</div>
            </div>
            <div class="stat-info">
                <h3>Monthly Expenses</h3>
                <p class="stat-value" id="monthlyExpenses">TSh 0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon roi"><i class="fas fa-trophy"></i></div>
                <div class="stat-trend up">+15%</div>
            </div>
            <div class="stat-info">
                <h3>ROI This Month</h3>
                <p class="stat-value" id="monthlyROI">0%</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon revenue"><i class="fas fa-coins"></i></div>
                <div class="stat-trend" id="revenueTrend">--</div>
            </div>
            <div class="stat-info">
                <h3>Total Revenue</h3>
                <p class="stat-value" id="totalRevenue">TSh 0</p>
            </div>
        </div>

        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon wallet"><i class="fas fa-university"></i></div>
                <div class="stat-trend" id="remainingBalanceTrend">--</div>
            </div>
            <div class="stat-info">
                <h3>Remaining Balance</h3>
                <p class="stat-value" id="remainingBalance">TSh 0</p>
            </div>
        </div>

        <div class="stat-card performance-table-card">
            <div class="stat-header">
                <div class="stat-icon performance"><i class="fas fa-trophy"></i></div>
                <div class="stat-trend up">Top 5</div>
            </div>
            <div class="stat-info">
                <h3>Performance</h3>
                <div class="performance-table" id="performanceTable">
                    <div class="performance-table-header">
                        <span>Business</span>
                        <span>Returns</span>
                        <span>Break-even</span>
                    </div>
                    <div class="performance-table-body" id="performanceTableBody">
                        <!-- Performance data will be populated here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
        <div class="chart-container">
            <h3>Expense Categories</h3>
            <canvas id="expenseChart"></canvas>
        </div>
        
        <div class="chart-container">
            <h3>Investment Types</h3>
            <canvas id="investmentChart"></canvas>
        </div>
    </div>

    <!-- Recent Activities -->
    <div class="recent-activities">
        <div class="activity-section">
            <h3>Recent Expenses</h3>
            <div id="recent-expenses" class="activity-list">
                <!-- Dynamic content will be loaded here -->
            </div>
        </div>
        
        <div class="activity-section">
            <h3>Recent Transactions</h3>
            <div id="recent-transactions" class="activity-list">
                <!-- Dynamic content will be loaded here -->
            </div>
        </div>
        
        <div class="activity-section">
            <h3>Recent Investments</h3>
            <div id="recent-investments" class="activity-list">
                <!-- Dynamic content will be loaded here -->
            </div>
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/analytics/dashboard');
        const data = await response.json();
        
        // Update dashboard metrics
        updateDashboardMetrics(data);
        
        // Load charts
        loadExpenseChart();
        loadInvestmentChart();
        
        // Load recent activities
        loadRecentActivities();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardMetrics(data) {
    // Update starting balance
    const startingBalanceEl = document.getElementById('startingBalance');
    if (startingBalanceEl) {
        startingBalanceEl.textContent = formatCurrency(data.startingBalance || 0);
    }
    
    // Update total portfolio
    const totalPortfolioEl = document.getElementById('totalPortfolio');
    if (totalPortfolioEl) {
        totalPortfolioEl.textContent = formatCurrency(data.totalPortfolio || 0);
    }
    
    // Update active investments
    const activeInvestmentsEl = document.getElementById('activeInvestments');
    if (activeInvestmentsEl) {
        activeInvestmentsEl.textContent = data.activeInvestments || 0;
    }
    
    // Update monthly expenses
    const monthlyExpensesEl = document.getElementById('monthlyExpenses');
    if (monthlyExpensesEl) {
        monthlyExpensesEl.textContent = formatCurrency(data.monthlyExpenses || 0);
    }
    
    // Update monthly ROI
    const monthlyROIEl = document.getElementById('monthlyROI');
    if (monthlyROIEl) {
        monthlyROIEl.textContent = (data.monthlyROI || 0) + '%';
    }
    
    // Update total revenue
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = formatCurrency(data.totalRevenue || 0);
    }
    
    // Update remaining balance
    const remainingBalanceEl = document.getElementById('remainingBalance');
    if (remainingBalanceEl) {
        remainingBalanceEl.textContent = formatCurrency(data.remainingBalance || 0);
    }
    
    // Update trends
    updateBalanceTrends(data.startingBalance || 0, data.remainingBalance || 0);
    updateRevenueTrend(data.totalRevenue || 0);
}

function formatCurrency(amount) {
    return 'TSh ' + new Intl.NumberFormat().format(amount);
}

function updateBalanceTrends(startingBalance, remainingBalance) {
    const startingTrendElement = document.getElementById('startingBalanceTrend');
    const remainingTrendElement = document.getElementById('remainingBalanceTrend');
    
    if (startingTrendElement) {
        startingTrendElement.textContent = 'Initial';
        startingTrendElement.className = 'stat-trend';
    }
    
    if (remainingTrendElement) {
        if (startingBalance > 0) {
            const changePercent = ((remainingBalance - startingBalance) / startingBalance * 100);
            const formattedPercent = Math.abs(changePercent).toFixed(1);
            remainingTrendElement.textContent = changePercent >= 0 ? `+${formattedPercent}%` : `-${formattedPercent}%`;
            remainingTrendElement.className = changePercent >= 0 ? 'stat-trend up' : 'stat-trend down';
        } else {
            remainingTrendElement.textContent = 'Current';
            remainingTrendElement.className = 'stat-trend';
        }
    }
}

function updateRevenueTrend(totalRevenue) {
    const revenueTrendElement = document.getElementById('revenueTrend');
    
    if (revenueTrendElement) {
        if (totalRevenue > 0) {
            revenueTrendElement.textContent = 'Active';
            revenueTrendElement.className = 'stat-trend up';
        } else {
            revenueTrendElement.textContent = 'No Data';
            revenueTrendElement.className = 'stat-trend';
        }
    }
}

function loadExpenseChart() {
    // Chart loading logic will be implemented here
    console.log('Loading expense chart...');
}

function loadInvestmentChart() {
    // Chart loading logic will be implemented here
    console.log('Loading investment chart...');
}

function loadRecentActivities() {
    // Recent activities loading logic will be implemented here
    console.log('Loading recent activities...');
}
</script>
@endpush