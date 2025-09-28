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
                        <span>Type</span>
                        <span>Investment</span>
                        <span>Expenses</span>
                        <span>Total Cost</span>
                        <span>Returns</span>
                        <span>Net Profit</span>
                        <span>ROI</span>
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
    <div class="projects-section">
        <h2>Investments Overview</h2>
        <div class="projects-grid" id="investmentsGrid">
            <!-- Investment cards will be dynamically loaded here -->
        </div>
    </div>
</div>
@endsection

@push('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadInvestments();
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
    // Update starting balance (using total_balance from summary)
    const startingBalanceEl = document.getElementById('startingBalance');
    if (startingBalanceEl) {
        startingBalanceEl.textContent = formatCurrency(data.summary?.total_balance || 0);
    }
    
    // Update total portfolio (using total_investments from summary)
    const totalPortfolioEl = document.getElementById('totalPortfolio');
    if (totalPortfolioEl) {
        totalPortfolioEl.textContent = formatCurrency(data.summary?.total_investments || 0);
    }
    
    // Update active investments (count from recent activities)
    const activeInvestmentsEl = document.getElementById('activeInvestments');
    if (activeInvestmentsEl) {
        activeInvestmentsEl.textContent = data.recent_activities?.investments?.length || 0;
    }
    
    // Update monthly expenses (using monthly_expenses from summary)
    const monthlyExpensesEl = document.getElementById('monthlyExpenses');
    if (monthlyExpensesEl) {
        monthlyExpensesEl.textContent = formatCurrency(data.summary?.monthly_expenses || 0);
    }
    
    // Update monthly ROI (calculate from investment data if available)
    const monthlyROIEl = document.getElementById('monthlyROI');
    if (monthlyROIEl) {
        // Fetch investment data to calculate proper ROI
        fetch('/api/investments')
            .then(response => response.json())
            .then(investments => {
                if (investments && investments.length > 0) {
                    // Calculate average ROI from all investments
                    const totalROI = investments.reduce((sum, inv) => sum + (inv.roi || 0), 0);
                    const avgROI = (totalROI / investments.length).toFixed(2);
                    monthlyROIEl.textContent = avgROI + '%';
                } else {
                    monthlyROIEl.textContent = '0%';
                }
            })
            .catch(error => {
                console.error('Error fetching investment data:', error);
                monthlyROIEl.textContent = '0%';
            });
    }
    
    // Update total revenue (using monthly_income from summary)
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
        totalRevenueEl.textContent = formatCurrency(data.summary?.monthly_income || 0);
    }
    
    // Update remaining balance (calculate as starting balance minus investments and expenses)
    const remainingBalanceEl = document.getElementById('remainingBalance');
    if (remainingBalanceEl) {
        const startingBalance = data.summary?.total_balance || 0;
        const totalInvestments = data.summary?.total_investments || 0;
        const monthlyExpenses = data.summary?.monthly_expenses || 0;
        const remainingBalance = startingBalance - totalInvestments - monthlyExpenses;
        remainingBalanceEl.textContent = formatCurrency(remainingBalance);
    }
    
    // Update trends
    const startingBalance = data.summary?.total_balance || 0;
    const totalInvestments = data.summary?.total_investments || 0;
    const monthlyExpenses = data.summary?.monthly_expenses || 0;
    const remainingBalance = startingBalance - totalInvestments - monthlyExpenses;
    updateBalanceTrends(startingBalance, remainingBalance);
    updateRevenueTrend(data.summary?.monthly_income || 0);
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

function loadInvestments() {
    fetch('/api/investments')
        .then(response => response.json())
        .then(investments => {
            const investmentsGrid = document.getElementById('investmentsGrid');
            if (!investmentsGrid) return;
            
            if (investments.length === 0) {
                investmentsGrid.innerHTML = '<div class="no-projects">No investments found. Create your first investment to get started!</div>';
                return;
            }
            
            investmentsGrid.innerHTML = investments.map(investment => createInvestmentCard(investment)).join('');
            
            // Initialize charts for each investment
            investments.forEach(investment => {
                initializeInvestmentCharts(investment);
            });
        })
        .catch(error => {
            console.error('Error loading investments:', error);
            const investmentsGrid = document.getElementById('investmentsGrid');
            if (investmentsGrid) {
                investmentsGrid.innerHTML = '<div class="error-message">Error loading investments. Please try again.</div>';
            }
        });
}

function createInvestmentCard(investment) {
    const breakEvenPercentage = investment.breakEvenAnalysis.percentage_to_break_even || 0;
    const isBreakEven = investment.breakEvenAnalysis.is_profitable;
    
    return `
        <div class="project-card" data-investment-id="${investment.id}">
            <div class="project-header">
                <div class="project-info">
                    <h3>${investment.name}</h3>
                    <p>${investment.type}</p>
                    <small>Purchased: ${new Date(investment.purchase_date).toLocaleDateString()}</small>
                </div>
                <div class="project-status active">Active</div>
            </div>
            
            <div class="project-metrics">
                <div class="metric-item">
                    <div class="metric-value">${formatCurrency(investment.totalExpenses)}</div>
                    <div class="metric-label">Expenses</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${formatCurrency(investment.totalReturns)}</div>
                    <div class="metric-label">Returns</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${formatCurrency(investment.netProfit)}</div>
                    <div class="metric-label">Net Profit</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${investment.roi.toFixed(1)}%</div>
                    <div class="metric-label">ROI</div>
                </div>
            </div>
            
            <div class="project-charts">
                <div class="mini-chart">
                    <h4>Monthly Expenses</h4>
                    <canvas id="expenseChart-${investment.id}" class="chart-canvas"></canvas>
                </div>
                <div class="mini-chart">
                    <h4>Monthly Returns</h4>
                    <canvas id="revenueChart-${investment.id}" class="chart-canvas"></canvas>
                </div>
            </div>
            
            <div class="break-even-section">
                <div class="break-even-header">
                    <h4>Break-even Analysis</h4>
                    <span class="break-even-days">${investment.breakEvenAnalysis.break_even_days ? investment.breakEvenAnalysis.break_even_days + ' days' : 'Not reached'}</span>
                </div>
                <div class="break-even-progress">
                    <div class="break-even-fill" style="width: ${Math.min(breakEvenPercentage, 100)}%"></div>
                </div>
                <div class="break-even-text">
                    ${isBreakEven ? 'Profitable!' : `${formatCurrency(investment.breakEvenAnalysis.remaining_to_break_even)} remaining to break-even`}
                </div>
            </div>
        </div>
    `;
}

function initializeInvestmentCharts(investment) {
    // Initialize expense chart
    const expenseCtx = document.getElementById(`expenseChart-${investment.id}`);
    if (expenseCtx) {
        new Chart(expenseCtx, {
            type: 'line',
            data: {
                labels: investment.monthlyData.map(d => d.month),
                datasets: [{
                    label: 'Expenses',
                    data: investment.monthlyData.map(d => d.expenses),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
    }
    
    // Initialize returns chart
    const revenueCtx = document.getElementById(`revenueChart-${investment.id}`);
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: investment.monthlyData.map(d => d.month),
                datasets: [{
                    label: 'Returns',
                    data: investment.monthlyData.map(d => d.revenue),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                }
            }
        });
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