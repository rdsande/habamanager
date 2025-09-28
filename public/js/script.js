// Data Storage - Now loaded from API
let investments = [];
let expenses = [];
let dailyRevenues = {}

// Investment Returns Functions
let currentInvestmentId = null;
let investmentReturns = [];

function showAddReturn(investmentId) {
    if (!investmentId) {
        console.error('No investment ID provided');
        return;
    }
    
    // Set the current investment ID
    currentInvestmentId = investmentId;
    
    // Reset form
    document.getElementById('returnForm').reset();
    document.getElementById('returnId').value = '';
    document.getElementById('returnInvestmentId').value = investmentId;
    
    // Set today's date as default
    document.getElementById('returnDate').value = new Date().toISOString().split('T')[0];
    
    // Set modal title and button text for adding
    document.getElementById('returnModalTitle').textContent = 'Add Return';
    document.getElementById('returnSubmitBtn').textContent = 'Add Return';
    
    const modal = document.getElementById('returnModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showEditReturn(returnId) {
    const returnData = investmentReturns.find(ret => ret.id === returnId);
    if (!returnData) {
        console.error('Return not found:', returnId);
        return;
    }
    
    // Populate form with existing return data
    document.getElementById('returnId').value = returnData.id;
    document.getElementById('returnInvestmentId').value = returnData.investment_id;
    document.getElementById('returnDate').value = returnData.return_date || '';
    document.getElementById('returnAmount').value = returnData.amount || '';
    document.getElementById('periodType').value = returnData.period_type || '';
    document.getElementById('returnComment').value = returnData.comment || '';
    
    // Set modal title and button text for editing
    document.getElementById('returnModalTitle').textContent = 'Edit Return';
    document.getElementById('returnSubmitBtn').textContent = 'Update Return';
    
    const modal = document.getElementById('returnModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Return Form Handler
const returnForm = document.getElementById('returnForm');
if (returnForm) {
    returnForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const returnId = document.getElementById('returnId').value;
        
        if (returnId) {
            await updateReturn(returnId);
        } else {
            await addReturn();
        }
    });
}

async function addReturn() {
    try {
        showLoadingState(true);
        
        const returnData = {
            investment_id: document.getElementById('returnInvestmentId').value,
            return_date: document.getElementById('returnDate').value,
            amount: getNumericValue(document.getElementById('returnAmount')),
            period_type: document.getElementById('periodType').value,
            comment: document.getElementById('returnComment').value
        };
        
        const response = await fetch('/api/investment-returns', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(returnData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add return');
        }
        
        const result = await response.json();
        
        // Update local data
        investmentReturns.push(result.return);
        
        // Update displays
        loadInvestmentReturns(currentInvestmentId);
        renderInvestments(); // Update investment list to show new totals
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('returnModal').classList.remove('show');
        document.getElementById('returnForm').reset();
        
        apiService.showSuccessMessage('Return added successfully!');
        
    } catch (error) {
        console.error('Error adding return:', error);
        apiService.handleError(error, 'Adding return');
    } finally {
        showLoadingState(false);
    }
}

async function updateReturn(returnId) {
    try {
        showLoadingState(true);
        
        const returnData = {
            return_date: document.getElementById('returnDate').value,
            amount: getNumericValue(document.getElementById('returnAmount')),
            period_type: document.getElementById('periodType').value,
            comment: document.getElementById('returnComment').value
        };
        
        const response = await fetch(`/api/investment-returns/${returnId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify(returnData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update return');
        }
        
        const result = await response.json();
        
        // Update local data
        const index = investmentReturns.findIndex(ret => ret.id === returnId);
        if (index !== -1) {
            investmentReturns[index] = result.return;
        }
        
        // Update displays
        loadInvestmentReturns(currentInvestmentId);
        renderInvestments(); // Update investment list to show new totals
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('returnModal').classList.remove('show');
        document.getElementById('returnForm').reset();
        
        apiService.showSuccessMessage('Return updated successfully!');
        
    } catch (error) {
        console.error('Error updating return:', error);
        apiService.handleError(error, 'Updating return');
    } finally {
        showLoadingState(false);
    }
}

async function deleteReturn(returnId) {
    if (!confirm('Are you sure you want to delete this return? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingState(true);
        
        const response = await fetch(`/api/investment-returns/${returnId}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete return');
        }
        
        // Remove from local data
        const index = investmentReturns.findIndex(ret => ret.id === returnId);
        if (index !== -1) {
            investmentReturns.splice(index, 1);
        }
        
        // Update displays
        loadInvestmentReturns(currentInvestmentId);
        renderInvestments(); // Update investment list to show new totals
        updateDashboard();
        
        apiService.showSuccessMessage('Return deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting return:', error);
        apiService.handleError(error, 'Deleting return');
    } finally {
        showLoadingState(false);
    }
}

async function loadInvestmentReturns(investmentId) {
    try {
        const response = await fetch(`/api/investment-returns?investment_id=${investmentId}`);
        
        if (!response.ok) {
            throw new Error('Failed to load returns');
        }
        
        investmentReturns = await response.json();
        renderInvestmentReturns();
        
    } catch (error) {
        console.error('Error loading investment returns:', error);
        investmentReturns = [];
        renderInvestmentReturns();
    }
}

function renderInvestmentReturns() {
    const container = document.getElementById('returnsList');
    if (!container) return;
    
    if (investmentReturns.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar" style="font-size: 24px; margin-bottom: 8px; opacity: 0.5;"></i>
                <p>No returns recorded yet.</p>
            </div>
        `;
        return;
    }
    
    // Calculate totals
    const totalReturns = investmentReturns.reduce((sum, ret) => sum + parseFloat(ret.amount || 0), 0);
    const dailyReturns = investmentReturns.filter(ret => ret.period_type === 'day');
    const weeklyReturns = investmentReturns.filter(ret => ret.period_type === 'week');
    
    container.innerHTML = `
        <div class="returns-summary">
            <div class="summary-item">
                <span class="label">Total Returns:</span>
                <span class="value">${formatCurrency(totalReturns)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Daily Returns:</span>
                <span class="value">${dailyReturns.length} entries</span>
            </div>
            <div class="summary-item">
                <span class="label">Weekly Returns:</span>
                <span class="value">${weeklyReturns.length} entries</span>
            </div>
        </div>
        
        <div class="returns-table">
            <div class="table-header">
                <div class="col-date">Date</div>
                <div class="col-amount">Amount</div>
                <div class="col-period">Period</div>
                <div class="col-comment">Comment</div>
                <div class="col-actions">Actions</div>
            </div>
            ${investmentReturns.map(returnData => `
                <div class="table-row">
                    <div class="col-date">${formatDate(returnData.return_date)}</div>
                    <div class="col-amount">${formatCurrency(returnData.amount)}</div>
                    <div class="col-period">
                        <span class="period-badge ${returnData.period_type}">
                            ${returnData.period_type === 'day' ? 'Daily' : 'Weekly'}
                        </span>
                    </div>
                    <div class="col-comment">${returnData.comment || '-'}</div>
                    <div class="col-actions">
                        <button class="btn btn-sm btn-secondary" onclick="showEditReturn(${returnData.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteReturn(${returnData.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function showInvestmentDetails(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) {
        console.error('Investment not found:', investmentId);
        return;
    }
    
    currentInvestmentId = investmentId;
    
    // Populate investment details
    const detailsContent = document.getElementById('investmentDetailsContent');
    if (detailsContent) {
        const roi = investment.roi || 0;
        const roiClass = roi >= 0 ? 'positive' : 'negative';
        const breakEvenText = investment.breakEvenMonths 
            ? `${investment.breakEvenMonths.toFixed(1)} months` 
            : 'N/A';
        
        detailsContent.innerHTML = `
            <div class="investment-details">
                <div class="detail-item">
                    <span class="label">Business Name:</span>
                    <span class="value">${investment.name || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Business Type:</span>
                    <span class="value">${investment.type || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Investment Amount:</span>
                    <span class="value">${formatCurrency(investment.amount)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Total Expenses:</span>
                    <span class="value">${formatCurrency(investment.totalExpenses || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Total Cost:</span>
                    <span class="value">${formatCurrency(investment.totalCost || investment.amount)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Purchase Date:</span>
                    <span class="value">${formatDate(investment.purchase_date)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Total Returns:</span>
                    <span class="value">${formatCurrency(investment.totalReturns || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">Net Profit:</span>
                    <span class="value ${(investment.netProfit || 0) >= 0 ? 'positive' : 'negative'}">${formatCurrency(investment.netProfit || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="label">ROI:</span>
                    <span class="value ${roiClass}">${roi.toFixed(2)}%</span>
                </div>
                <div class="detail-item">
                    <span class="label">Break-even Time:</span>
                    <span class="value">${breakEvenText}</span>
                </div>
            </div>
        `;
    }
    
    // Load and display returns
    loadInvestmentReturns(investmentId);
    
    // Show modal
    const modal = document.getElementById('investmentDetailsModal');
    if (modal) {
        modal.classList.add('show');
    }
};
let accounts = [];
let transactions = [];
let isDataLoaded = false;

// Load data from API
async function loadData() {
    try {
        showLoadingState(true);
        const data = await apiService.loadAllData();
        
        investments = data.investments || [];
        expenses = data.expenses || [];
        accounts = data.accounts || [];
        transactions = data.transactions || [];
        investmentReturns = data.investmentReturns || [];
        

        
        // Process and normalize investment data
        dailyRevenues = {};
        investments.forEach(investment => {
            // Calculate total returns for this investment from the returns data
            const investmentReturnsData = investmentReturns.filter(ret => ret.investment_id == investment.id);
            const totalReturns = investmentReturnsData.reduce((sum, ret) => sum + parseFloat(ret.amount || 0), 0);
            
            // Map backend fields to frontend expected fields
            investment.totalReturns = totalReturns;
            investment.dailyRevenues = investment.dailyRevenues || investment.daily_revenues || [];
            
            if (investment.dailyRevenues && investment.dailyRevenues.length > 0) {
                dailyRevenues[investment.id] = investment.dailyRevenues;
            }
        });
        
        isDataLoaded = true;
        showLoadingState(false);
        
        // Update all displays after loading data
        updateDashboard();
        renderInvestments();
        renderExpenses();
        updateAccountsDisplay();
        updateTransactionsDisplay();
        populateAccountDropdowns();
        
    } catch (error) {
        console.error('Error loading data:', error);
        apiService.handleError(error, 'Loading data');
        showLoadingState(false);
    }
}

// Show/hide loading state
function showLoadingState(show) {
    let loadingDiv = document.getElementById('loading-overlay');
    if (!loadingDiv && show) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            ">
                <div style="
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 10px;
                    "></div>
                    <p>Loading data...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingDiv);
    } else if (loadingDiv) {
        loadingDiv.style.display = show ? 'flex' : 'none';
        if (!show) {
            setTimeout(() => {
                if (loadingDiv && loadingDiv.parentNode) {
                    loadingDiv.parentNode.removeChild(loadingDiv);
                }
            }, 300);
        }
    }
}

// Chart instances
let financialChart = null;
let breakEvenChart = null;

// Initialize charts
function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet, retrying in 100ms...');
        setTimeout(initializeCharts, 100);
        return;
    }
    
    // Financial Overview Chart
    const ctx1 = document.getElementById('overviewChart');
    if (ctx1) {
        financialChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Investments', 'Expenses', 'Revenue', 'Profit'],
                datasets: [{
                    label: 'Amount (TSh)',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#3b82f6',
                        '#8b5cf6'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    // Break-even progress is handled by custom progress circle in updateCharts()
}

// Update charts with current data
function updateCharts() {
    const totalInvestment = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalRevenue = investments.reduce((sum, inv) => sum + (inv.totalReturns || 0), 0);
    const totalProfit = totalRevenue - totalInvestment - totalExpenses;
    
    // Update financial chart
    if (financialChart) {
        financialChart.data.datasets[0].data = [totalInvestment, totalExpenses, totalRevenue, totalProfit];
        financialChart.update();
    }
    
    // Calculate break-even progress
    // Break-even should account for starting balance
    const startingBalance = calculateStartingBalance();
    const netAmountToRecover = Math.max(0, totalInvestment + totalExpenses - startingBalance);
    const progress = netAmountToRecover > 0 ? Math.min((totalRevenue / netAmountToRecover) * 100, 100) : 100;
    
    // Update break-even progress circle
    const progressCircle = document.getElementById('progressCircle');
    const progressPercentage = document.getElementById('progressPercentage');
    const estimatedTime = document.getElementById('estimatedTime');
    
    if (progressCircle && progressPercentage) {
        // Update progress circle background
        progressCircle.style.background = `conic-gradient(#10b981 ${progress * 3.6}deg, #e2e8f0 ${progress * 3.6}deg)`;
        
        // Update percentage text
        progressPercentage.textContent = `${Math.round(progress)}%`;
        
        // Calculate estimated break-even time
        if (estimatedTime) {
            if (progress >= 100) {
                estimatedTime.textContent = 'Achieved';
            } else if (totalRevenue > 0 && netAmountToRecover > totalRevenue) {
                // Calculate average daily revenue
                const totalDays = investments.reduce((days, inv) => {
                    const startDate = new Date(inv.date);
                    const currentDate = new Date();
                    return Math.max(days, Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)));
                }, 1);
                
                const dailyAverage = totalRevenue / totalDays;
                const remainingAmount = netAmountToRecover - totalRevenue;
                const estimatedDays = dailyAverage > 0 ? Math.ceil(remainingAmount / dailyAverage) : 0;
                const estimatedMonths = Math.ceil(estimatedDays / 30);
                
                estimatedTime.textContent = estimatedMonths > 0 ? `${estimatedMonths} months` : '-- months';
            } else {
                estimatedTime.textContent = '-- months';
            }
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', async function() {
    initializeTabs();
    
    // Initialize charts first
    setTimeout(() => {
        initializeCharts();
    }, 100);
    
    // Set up account management event listeners
    setupAccountEventListeners();
    
    // Set up all button event listeners
    setupButtonEventListeners();
    
    // Initialize audit logs functionality
    initializeAuditLogs();
    
    // Input formatting disabled - was causing values to clear when switching fields
    // addInputFormatting();
    
    // Load data from API and update all displays
    await loadData();
    
    // Update charts after data is loaded
    setTimeout(() => {
        updateCharts();
        renderAnalytics();
        populateBusinessDropdown();
        populateAccountDropdowns();
    }, 200);
});

// Tab Management
function initializeTabs() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-tab');
            
            // Remove active class from all nav items and contents
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked nav item and corresponding content
            item.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Update page title based on active tab
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                const tabName = item.querySelector('span').textContent;
                pageTitle.textContent = tabName;
            }
            
            // Refresh content based on active tab
            if (targetTab === 'analytics') {
                renderAnalytics();
            } else if (targetTab === 'investments') {
                renderInvestments();
            } else if (targetTab === 'expenses') {
                renderExpenses();
            } else if (targetTab === 'accounts') {
                updateAccountsDisplay();
                updateTransactionsDisplay();
            } else if (targetTab === 'dashboard') {
                updateDashboard();
            } else if (targetTab === 'performance') {
                renderPerformance();
            } else if (targetTab === 'audit-logs') {
                loadAuditLogs();
            }
        });
    });
}

// Dashboard Functions
function updateDashboard() {
    const totalPortfolio = calculateTotalPortfolio();
    const activeInvestments = investments.length;
    const monthlyExpenses = calculateMonthlyExpenses();
    const monthlyROI = calculateMonthlyROI();
    const startingBalance = calculateStartingBalance();
    const remainingBalance = calculateRemainingBalance();
    const totalRevenue = calculateTotalRevenue();
    
    // Calculate total account balances
    const totalAccountBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    
    // Update dashboard elements with null checks
    const totalPortfolioEl = document.getElementById('totalPortfolio');
    if (totalPortfolioEl) totalPortfolioEl.textContent = formatCurrency(totalPortfolio);
    
    const activeInvestmentsEl = document.getElementById('activeInvestments');
    if (activeInvestmentsEl) activeInvestmentsEl.textContent = activeInvestments;
    
    const monthlyExpensesEl = document.getElementById('monthlyExpenses');
    if (monthlyExpensesEl) monthlyExpensesEl.textContent = formatCurrency(monthlyExpenses);
    
    const monthlyROIEl = document.getElementById('monthlyROI');
    if (monthlyROIEl) monthlyROIEl.textContent = monthlyROI + '%';
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    
    // Update new balance displays
    const startingBalanceEl = document.getElementById('startingBalance');
    if (startingBalanceEl) startingBalanceEl.textContent = formatCurrency(startingBalance);
    
    const remainingBalanceEl = document.getElementById('remainingBalance');
    if (remainingBalanceEl) remainingBalanceEl.textContent = formatCurrency(remainingBalance);
    
    // Update balance trends
    updateBalanceTrends(startingBalance, remainingBalance);
    updateRevenueTrend(totalRevenue);
    
    // Update account balance if element exists
    const accountBalanceElement = document.getElementById('totalAccountBalance');
    if (accountBalanceElement) {
        accountBalanceElement.textContent = formatCurrency(totalAccountBalance);
    }
    
    // Update recent transactions display
    updateRecentTransactions();
    
    // Update charts when dashboard updates
    updateCharts();
    
    // Update dashboard performance summary
    updateDashboardPerformance();
    
    // Update performance table
    updatePerformanceTable();
}

function calculateTotalPortfolio() {
    // Calculate total invested amount (not including returns)
    return investments.reduce((total, investment) => {
        return total + (investment.amount || 0);
    }, 0);
}

function calculateMonthlyExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((total, expense) => total + expense.amount, 0);
}

function calculateMonthlyROI() {
    const totalInvested = investments.reduce((total, inv) => total + (inv.amount || 0), 0);
    const totalReturns = investmentReturns.reduce((total, ret) => total + parseFloat(ret.amount || 0), 0);
    
    if (totalInvested === 0 || isNaN(totalInvested) || isNaN(totalReturns)) return 0;
    
    // Revenue-based ROI = (Total Revenue / Total Investment) × 100%
    const roi = (totalReturns / totalInvested) * 100;
    
    return isNaN(roi) ? 0 : roi.toFixed(1);
}

function calculateTotalRevenue() {
    // Calculate total revenue from all investment returns
    return investmentReturns.reduce((total, ret) => total + parseFloat(ret.amount || 0), 0);
}

function calculateStartingBalance() {
    // Calculate starting balance from account balances (total money in bank accounts)
    const totalAccountBalance = accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
    
    // Debug logging
    console.log('Accounts data:', accounts);
    console.log('Total account balance:', totalAccountBalance);
    
    return totalAccountBalance;
}

function calculateRemainingBalance() {
    // Calculate remaining balance as: starting balance + total revenues - total investments - total expenses
    const startingBalance = calculateStartingBalance();
    const totalRevenues = calculateTotalRevenue();
    const totalInvestments = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    
    const remainingBalance = startingBalance + totalRevenues - totalInvestments - totalExpenses;
    
    // Ensure we don't return negative values (minimum 0)
    return Math.max(0, remainingBalance);
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
        const formattedPercent = formatNumber(changePercent, 1);
        remainingTrendElement.textContent = changePercent >= 0 ? `+${formattedPercent}%` : `${formattedPercent}%`;
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
        // For now, we'll show a simple indicator based on current data
        // TODO: Implement proper trend calculation using API analytics endpoints
        if (totalRevenue > 0) {
            revenueTrendElement.textContent = 'Active';
            revenueTrendElement.className = 'stat-trend up';
        } else {
            revenueTrendElement.textContent = 'No Data';
            revenueTrendElement.className = 'stat-trend';
        }
    }
}

// Investment Management
function showAddInvestment() {
    // Reset form
    document.getElementById('investmentForm').reset();
    document.getElementById('editInvestmentId').value = '';
    
    // Set today's date as default for purchase date
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    
    // Set modal title and button text for adding
    document.getElementById('investmentModalTitle').textContent = 'Add New Investment';
    document.getElementById('investmentSubmitBtn').textContent = 'Add Investment';
    
    const modal = document.getElementById('investmentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Investment Form Handler
const investmentForm = document.getElementById('investmentForm');
if (investmentForm) {
    investmentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const editInvestmentId = document.getElementById('editInvestmentId').value;
    
    if (editInvestmentId) {
        await updateInvestment(editInvestmentId);
    } else {
        await addInvestment();
    }
    });
}

async function addInvestment() {
    try {
        showLoadingState(true);
        
        const investmentData = {
            name: document.getElementById('businessName').value,
            type: document.getElementById('businessType').value,
            amount: getNumericValue(document.getElementById('investmentAmount')),
            purchase_date: document.getElementById('startDate').value
        };
        
        const newInvestment = await apiService.createInvestment(investmentData);
        
        // Update local data
        investments.push(newInvestment);
        
        // Update displays
        renderInvestments();
        updateDashboard();
        populateBusinessDropdown();
        updateAccountsDisplay();
        updateTransactionsDisplay();
        
        // Close modal and reset form
        document.getElementById('investmentModal').classList.remove('show');
        document.getElementById('investmentForm').reset();
        
        apiService.showSuccessMessage('Investment added successfully!');
        
    } catch (error) {
        console.error('Error adding investment:', error);
        apiService.handleError(error, 'Adding investment');
    } finally {
        showLoadingState(false);
    }
}

function showEditInvestment(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) {
        console.error('Investment not found:', investmentId);
        return;
    }
    
    // Populate form with existing investment data
    document.getElementById('editInvestmentId').value = investment.id;
    document.getElementById('businessName').value = investment.name || '';
    document.getElementById('businessType').value = investment.type || '';
    document.getElementById('investmentAmount').value = investment.amount || '';
    document.getElementById('startDate').value = investment.purchase_date || '';
    
    // Set modal title and button text for editing
    document.getElementById('investmentModalTitle').textContent = 'Edit Investment';
    document.getElementById('investmentSubmitBtn').textContent = 'Update Investment';
    
    const modal = document.getElementById('investmentModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function updateInvestment(investmentId) {
    try {
        showLoadingState(true);
        
        const investmentData = {
            name: document.getElementById('businessName').value,
            type: document.getElementById('businessType').value,
            amount: getNumericValue(document.getElementById('investmentAmount')),
            purchase_date: document.getElementById('startDate').value
        };
        
        const updatedInvestment = await apiService.updateInvestment(investmentId, investmentData);
        
        // Update local data
        const index = investments.findIndex(inv => inv.id === investmentId);
        if (index !== -1) {
            investments[index] = updatedInvestment;
        }
        
        // Update displays
        renderInvestments();
        updateDashboard();
        populateBusinessDropdown();
        
        // Close modal and reset form
        document.getElementById('investmentModal').classList.remove('show');
        document.getElementById('investmentForm').reset();
        
        apiService.showSuccessMessage('Investment updated successfully!');
        
    } catch (error) {
        console.error('Error updating investment:', error);
        apiService.handleError(error, 'Updating investment');
    } finally {
        showLoadingState(false);
    }
}

async function deleteInvestment(investmentId) {
    if (!confirm('Are you sure you want to delete this investment? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.deleteInvestment(investmentId);
        
        // Remove from local data
        const index = investments.findIndex(inv => inv.id === investmentId);
        if (index !== -1) {
            investments.splice(index, 1);
        }
        
        // Update displays
        renderInvestments();
        updateDashboard();
        populateBusinessDropdown();
        
        apiService.showSuccessMessage('Investment deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting investment:', error);
        apiService.handleError(error, 'Deleting investment');
    } finally {
        showLoadingState(false);
    }
}

function renderInvestments() {
    const container = document.getElementById('investmentsList');
    if (!container) return;
    
    if (investments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No investments yet. Add your first investment to get started!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = investments.map(investment => {
        const roi = investment.amount > 0 ? ((investment.totalReturns || 0) / investment.amount * 100) : 0;
        const roiClass = roi >= 0 ? 'positive' : 'negative';
        const roiIcon = roi >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        
        return `
            <div class="investment-item">
                <div class="investment-header">
                    <div>
                        <h3 class="business-name">${investment.name || 'Unnamed Investment'}</h3>
                        <span class="business-type">${investment.type || 'General'}</span>
                    </div>
                    <div class="investment-actions">
                        <button class="btn-primary" onclick="showAddReturn(${investment.id})" style="background: #059669;">
                            <i class="fas fa-plus"></i> Add Revenue
                        </button>
                        <button class="btn-primary" onclick="showEditInvestment(${investment.id})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-primary" onclick="deleteInvestment(${investment.id})" style="background: #dc2626;">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="investment-details">
                    <div class="detail-item">
                        <div class="detail-label">Investment</div>
                        <div class="detail-value">${formatCurrency(investment.amount || 0)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Returns</div>
                        <div class="detail-value">${formatCurrency(investment.totalReturns || 0)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">ROI</div>
                        <div class="detail-value ${roiClass}">
                            <i class="fas ${roiIcon}"></i> ${roi.toFixed(1)}%
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Start Date</div>
                        <div class="detail-value">${formatDate(investment.date)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Expense Management
function showAddExpense() {
    // Reset form
    document.getElementById('expenseForm').reset();
    document.getElementById('editExpenseId').value = '';
    
    // Set modal title and button text for adding
    document.getElementById('expenseModalTitle').textContent = 'Add New Expense';
    document.getElementById('expenseSubmitBtn').textContent = 'Add Expense';
    
    // Set today's date as default
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    // Populate investment dropdown
    populateInvestmentDropdown();
    
    const modal = document.getElementById('expenseModal');
    if (modal) {
        modal.classList.add('show');
    }
}

// Expense Form Handler
const expenseForm = document.getElementById('expenseForm');
if (expenseForm) {
    expenseForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const editExpenseId = document.getElementById('editExpenseId').value;
    
    if (editExpenseId) {
        await updateExpense(editExpenseId);
    } else {
        await addExpense();
    }
    });
}

async function addExpense() {
    try {
        showLoadingState(true);
        
        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            category: document.getElementById('expenseCategory').value,
            amount: getNumericValue(document.getElementById('expenseAmount')),
            date: document.getElementById('expenseDate').value || new Date().toISOString().split('T')[0],
            payment_method: document.getElementById('paymentMethod').value,
            notes: document.getElementById('expenseNotes').value || '',
            investment_id: document.getElementById('relatedInvestment').value || null
        };
        
        const newExpense = await apiService.createExpense(expenseData);
        
        // Update local data
        expenses.push(newExpense);
        
        // Update displays
        renderExpenses();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('expenseModal').classList.remove('show');
        document.getElementById('expenseForm').reset();
        
        apiService.showSuccessMessage('Expense added successfully!');
        
    } catch (error) {
        console.error('Error adding expense:', error);
        apiService.handleError(error, 'Adding expense');
    } finally {
        showLoadingState(false);
    }
}

function showEditExpense(expenseId) {
    const expense = expenses.find(exp => exp.id === expenseId);
    if (!expense) {
        console.error('Expense not found:', expenseId);
        return;
    }
    
    // Populate form with existing expense data
    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('expenseDescription').value = expense.description || '';
    document.getElementById('expenseCategory').value = expense.category || '';
    document.getElementById('expenseAmount').value = expense.amount || '';
    document.getElementById('expenseDate').value = expense.date || '';
    document.getElementById('paymentMethod').value = expense.payment_method || '';
    document.getElementById('expenseNotes').value = expense.notes || '';
    document.getElementById('relatedInvestment').value = expense.investment_id || '';
    
    // Set modal title and button text for editing
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expenseSubmitBtn').textContent = 'Update Expense';
    
    // Populate investment dropdown
    populateInvestmentDropdown();
    
    const modal = document.getElementById('expenseModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function updateExpense(expenseId) {
    try {
        showLoadingState(true);
        
        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            category: document.getElementById('expenseCategory').value,
            amount: getNumericValue(document.getElementById('expenseAmount')),
            date: document.getElementById('expenseDate').value,
            payment_method: document.getElementById('paymentMethod').value,
            notes: document.getElementById('expenseNotes').value || ''
        };
        
        const updatedExpense = await apiService.updateExpense(expenseId, expenseData);
        
        // Update local data
        const index = expenses.findIndex(exp => exp.id === expenseId);
        if (index !== -1) {
            expenses[index] = updatedExpense;
        }
        
        // Update displays
        renderExpenses();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('expenseModal').classList.remove('show');
        document.getElementById('expenseForm').reset();
        
        apiService.showSuccessMessage('Expense updated successfully!');
        
    } catch (error) {
        console.error('Error updating expense:', error);
        apiService.handleError(error, 'Updating expense');
    } finally {
        showLoadingState(false);
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.deleteExpense(expenseId);
        
        // Remove from local data
        const index = expenses.findIndex(exp => exp.id === expenseId);
        if (index !== -1) {
            expenses.splice(index, 1);
        }
        
        // Update displays
        renderExpenses();
        updateDashboard();
        
        apiService.showSuccessMessage('Expense deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting expense:', error);
        apiService.handleError(error, 'Deleting expense');
    } finally {
        showLoadingState(false);
    }
}

function renderExpenses() {
    const container = document.getElementById('expensesList');
    if (!container) return;
    
    if (expenses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No expenses recorded yet. Add your first expense to start tracking!</p>
            </div>
        `;
        return;
    }
    
    // Sort expenses by date (newest first)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedExpenses.map(expense => `
        <div class="expense-item">
            <div class="investment-header">
                <div>
                    <h3 class="business-name">${expense.description || 'Unnamed Expense'}</h3>
                    <span class="business-type">${expense.category || 'General'}</span>
                </div>
                <div class="investment-actions">
                    <button class="btn-primary" onclick="showEditExpense('${expense.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-primary" onclick="deleteExpense('${expense.id}')" style="background: #dc2626;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="investment-details">
                <div class="detail-item">
                    <div class="detail-label">Amount</div>
                    <div class="detail-value">${formatCurrency(expense.amount || 0)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Date</div>
                    <div class="detail-value">${formatDate(expense.date)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Payment Method</div>
                    <div class="detail-value">${expense.payment_method || 'N/A'}</div>
                </div>
                ${expense.notes ? `
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <div class="detail-label">Notes</div>
                    <div class="detail-value">${expense.notes}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Account Management
// Account Management Functions
function handleAccountSubmit(e) {
    e.preventDefault();
    
    const editAccountId = document.getElementById('editAccountId').value;
    
    if (editAccountId) {
        updateAccount(editAccountId);
    } else {
        addAccount();
    }
}

// Expense Management Functions
function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const editExpenseId = document.getElementById('editExpenseId').value;
    
    if (editExpenseId) {
        updateExpense(editExpenseId);
    } else {
        addExpense();
    }
}

// Investment Management Functions
function handleInvestmentSubmit(e) {
    e.preventDefault();
    
    const editInvestmentId = document.getElementById('editInvestmentId').value;
    
    if (editInvestmentId) {
        updateInvestment(editInvestmentId);
    } else {
        addInvestment();
    }
}

// Transaction Management Functions
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const editTransactionId = document.getElementById('editTransactionId').value;
    
    if (editTransactionId) {
        updateTransaction(editTransactionId);
    } else {
        addTransaction();
    }
}

function setupAccountEventListeners() {
    // Account form handler
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const editAccountId = document.getElementById('editAccountId').value;
            
            if (editAccountId) {
                await updateAccount(editAccountId);
            } else {
                await addAccount();
            }
        });
    }
    
    // Transaction form handler
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const editTransactionId = document.getElementById('editTransactionId').value;
            
            if (editTransactionId) {
                await updateTransaction(editTransactionId);
            } else {
                await addTransaction();
            }
        });
    }
}

function showAddAccount() {
    // Reset form
    document.getElementById('accountForm').reset();
    document.getElementById('editAccountId').value = '';
    
    // Set modal title and button text for adding
    document.getElementById('accountModalTitle').textContent = 'Add New Account';
    document.getElementById('accountSubmitBtn').textContent = 'Add Account';
    
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function addAccount() {
    try {
        showLoadingState(true);
        
        const startingAmount = getNumericValue(document.getElementById('startingAmount'));
        
        const accountData = {
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            bank_name: document.getElementById('bankName').value || '',
            starting_amount: startingAmount,
            balance: startingAmount // Set balance equal to starting amount
        };
        
        const newAccount = await apiService.createAccount(accountData);
        
        // Update local data
        accounts.push(newAccount);
        
        // Update displays
        updateAccountsDisplay();
        populateAccountDropdowns();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('accountModal').classList.remove('show');
        document.getElementById('accountForm').reset();
        
        apiService.showSuccessMessage('Account added successfully!');
        
    } catch (error) {
        console.error('Error adding account:', error);
        apiService.handleError(error, 'Adding account');
    } finally {
        showLoadingState(false);
    }
}

function showEditAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        console.error('Account not found:', accountId);
        return;
    }
    
    // Populate form with existing account data
    document.getElementById('editAccountId').value = account.id;
    document.getElementById('accountName').value = account.name || '';
    document.getElementById('accountType').value = account.type || '';
    document.getElementById('bankName').value = account.bank_name || '';
    document.getElementById('startingAmount').value = account.starting_amount || account.balance || '';
    
    // Set modal title and button text for editing
    document.getElementById('accountModalTitle').textContent = 'Edit Account';
    document.getElementById('accountSubmitBtn').textContent = 'Update Account';
    
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function updateAccount(accountId) {
    try {
        showLoadingState(true);
        
        const startingAmount = getNumericValue(document.getElementById('startingAmount'));
        
        const accountData = {
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            bank_name: document.getElementById('bankName').value || '',
            starting_amount: startingAmount,
            balance: startingAmount // Set balance equal to starting amount
        };
        
        const updatedAccount = await apiService.updateAccount(accountId, accountData);
        
        // Update local data
        const index = accounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            accounts[index] = updatedAccount;
        }
        
        // Update displays
        updateAccountsDisplay();
        populateAccountDropdowns();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('accountModal').classList.remove('show');
        document.getElementById('accountForm').reset();
        
        apiService.showSuccessMessage('Account updated successfully!');
        
    } catch (error) {
        console.error('Error updating account:', error);
        apiService.handleError(error, 'Updating account');
    } finally {
        showLoadingState(false);
    }
}

async function deleteAccount(accountId) {
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.deleteAccount(accountId);
        
        // Remove from local data
        const index = accounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            accounts.splice(index, 1);
        }
        
        // Update displays
        updateAccountsDisplay();
        populateAccountDropdowns();
        updateDashboard();
        
        apiService.showSuccessMessage('Account deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting account:', error);
        apiService.handleError(error, 'Deleting account');
    } finally {
        showLoadingState(false);
    }
}

function updateAccountsDisplay() {
    const container = document.getElementById('accountsGrid');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-university" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No accounts added yet. Add your first account to start managing your finances!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = accounts.map(account => `
        <div class="account-card">
            <div class="account-header">
                <div class="account-info">
                    <h3>${account.name || 'Unnamed Account'}</h3>
                    <p class="account-type">${account.type || 'General'}</p>
                </div>
                <div class="account-icon">
                    <i class="fas fa-university"></i>
                </div>
            </div>
            <div class="account-balance">
                <div class="balance-label">Current Balance</div>
                <div class="balance-amount">${formatCurrency(account.balance || 0)}</div>
            </div>
            ${account.bank_name ? `<p><strong>Bank:</strong> ${account.bank_name}</p>` : ''}
            ${account.account_number ? `<p><strong>Account #:</strong> ${account.account_number}</p>` : ''}
            <div class="account-actions">
                <button class="account-btn deposit" onclick="showAddTransaction('${account.id}', 'deposit')">
                    <i class="fas fa-plus"></i> Deposit
                </button>
                <button class="account-btn withdraw" onclick="showAddTransaction('${account.id}', 'withdrawal')">
                    <i class="fas fa-minus"></i> Withdraw
                </button>
                <button class="btn-primary" onclick="showEditAccount('${account.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-primary" onclick="deleteAccount('${account.id}')" style="background: #dc2626;">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Transaction Management
function showAddTransaction(accountId = null, type = null) {
    // Reset form
    document.getElementById('transactionForm').reset();
    document.getElementById('editTransactionId').value = '';
    
    // Set modal title and button text for adding
    document.getElementById('transactionModalTitle').textContent = 'Add New Transaction';
    document.getElementById('transactionSubmitBtn').textContent = 'Add Transaction';
    
    // Pre-fill account and type if provided
    if (accountId) {
        document.getElementById('transactionAccount').value = accountId;
    }
    if (type) {
        document.getElementById('transactionType').value = type;
    }
    
    // Set today's date as default
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
    
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function addTransaction() {
    try {
        showLoadingState(true);
        
        const transactionData = {
            type: document.getElementById('transactionType').value,
            description: document.getElementById('transactionDescription').value,
            amount: getNumericValue(document.getElementById('transactionAmount')),
            date: document.getElementById('transactionDate').value || new Date().toISOString().split('T')[0],
            category: document.getElementById('transactionCategory').value || '',
            account_id: document.getElementById('transactionAccount').value,
            reference_number: document.getElementById('referenceNumber').value || '',
            notes: document.getElementById('transactionNotes').value || ''
        };
        
        const newTransaction = await apiService.createTransaction(transactionData);
        
        // Update local data
        transactions.push(newTransaction);
        
        // Refresh account data to get updated balances
        const updatedAccounts = await apiService.getAccounts();
        accounts.length = 0;
        accounts.push(...updatedAccounts);
        
        // Update displays
        updateTransactionsDisplay();
        updateAccountsDisplay();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('transactionModal').classList.remove('show');
        document.getElementById('transactionForm').reset();
        
        apiService.showSuccessMessage('Transaction added successfully!');
        
    } catch (error) {
        console.error('Error adding transaction:', error);
        apiService.handleError(error, 'Adding transaction');
    } finally {
        showLoadingState(false);
    }
}

function showEditTransaction(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) {
        console.error('Transaction not found:', transactionId);
        return;
    }
    
    // Populate form with existing transaction data
    document.getElementById('editTransactionId').value = transaction.id;
    document.getElementById('transactionType').value = transaction.type || '';
    document.getElementById('transactionDescription').value = transaction.description || '';
    document.getElementById('transactionAmount').value = transaction.amount || '';
    document.getElementById('transactionDate').value = transaction.date || '';
    document.getElementById('transactionCategory').value = transaction.category || '';
    document.getElementById('transactionAccount').value = transaction.account_id || '';
    document.getElementById('referenceNumber').value = transaction.reference_number || '';
    document.getElementById('transactionNotes').value = transaction.notes || '';
    
    // Set modal title and button text for editing
    document.getElementById('transactionModalTitle').textContent = 'Edit Transaction';
    document.getElementById('transactionSubmitBtn').textContent = 'Update Transaction';
    
    const modal = document.getElementById('transactionModal');
    if (modal) {
        modal.classList.add('show');
    }
}

async function updateTransaction(transactionId) {
    try {
        showLoadingState(true);
        
        const transactionData = {
            type: document.getElementById('transactionType').value,
            description: document.getElementById('transactionDescription').value,
            amount: getNumericValue(document.getElementById('transactionAmount')),
            date: document.getElementById('transactionDate').value,
            category: document.getElementById('transactionCategory').value || '',
            account_id: document.getElementById('transactionAccount').value,
            reference_number: document.getElementById('referenceNumber').value || '',
            notes: document.getElementById('transactionNotes').value || ''
        };
        
        const updatedTransaction = await apiService.updateTransaction(transactionId, transactionData);
        
        // Update local data
        const index = transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            transactions[index] = updatedTransaction;
        }
        
        // Refresh account data to get updated balances
        const updatedAccounts = await apiService.getAccounts();
        accounts.length = 0;
        accounts.push(...updatedAccounts);
        
        // Update displays
        updateTransactionsDisplay();
        updateAccountsDisplay();
        updateDashboard();
        
        // Close modal and reset form
        document.getElementById('transactionModal').classList.remove('show');
        document.getElementById('transactionForm').reset();
        
        apiService.showSuccessMessage('Transaction updated successfully!');
        
    } catch (error) {
        console.error('Error updating transaction:', error);
        apiService.handleError(error, 'Updating transaction');
    } finally {
        showLoadingState(false);
    }
}

async function deleteTransaction(transactionId) {
    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.deleteTransaction(transactionId);
        
        // Remove from local data
        const index = transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            transactions.splice(index, 1);
        }
        
        // Refresh account data to get updated balances
        const updatedAccounts = await apiService.getAccounts();
        accounts.length = 0;
        accounts.push(...updatedAccounts);
        
        // Update displays
        updateTransactionsDisplay();
        updateAccountsDisplay();
        updateDashboard();
        
        apiService.showSuccessMessage('Transaction deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting transaction:', error);
        apiService.handleError(error, 'Deleting transaction');
    } finally {
        showLoadingState(false);
    }
}

function updateTransactionsDisplay() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="empty-transactions">
                <i class="fas fa-exchange-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No transactions yet. Add your first transaction to start tracking!</p>
            </div>
        `;
        return;
    }
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedTransactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.account_id);
        const accountName = account ? account.name : 'Unknown Account';
        
        const isPositive = transaction.type === 'deposit';
        const amountClass = isPositive ? 'positive' : 'negative';
        const iconClass = getTransactionIcon(transaction.type);
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description || 'Transaction'}</div>
                    <div class="transaction-meta">
                        ${accountName} • ${transaction.category || 'General'} • ${formatDate(transaction.date)}
                    </div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${amountClass}">
                        ${isPositive ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount || 0))}
                    </div>
                    <div class="transaction-date">${formatTime(transaction.date)}</div>
                </div>
                <div class="investment-actions" style="margin-left: 16px;">
                    <button class="btn-primary" onclick="showEditTransaction('${transaction.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-primary" onclick="deleteTransaction('${transaction.id}')" style="background: #dc2626;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function getTransactionIcon(type) {
    switch (type) {
        case 'deposit': return 'fa-arrow-down';
        case 'withdrawal': return 'fa-arrow-up';
        case 'expense': return 'fa-shopping-cart';
        case 'investment': return 'fa-chart-line';
        case 'revenue': return 'fa-coins';
        default: return 'fa-exchange-alt';
    }
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    // Get the 5 most recent transactions
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        container.innerHTML = `
            <div class="empty-transactions">
                <p>No recent transactions</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentTransactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.account_id);
        const accountName = account ? account.name : 'Unknown Account';
        
        const isPositive = transaction.type === 'deposit';
        const amountClass = isPositive ? 'positive' : 'negative';
        const iconClass = getTransactionIcon(transaction.type);
        
        return `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-description">${transaction.description || 'Transaction'}</div>
                    <div class="transaction-meta">${accountName} • ${formatDate(transaction.date)}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount ${amountClass}">
                        ${isPositive ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount || 0))}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function populateAccountDropdowns() {
    const dropdowns = [
        'investmentAccount',
        'transactionAccount'
    ];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            const currentValue = dropdown.value;
            dropdown.innerHTML = '<option value="">Select Account (Optional)</option>';
            
            accounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                option.textContent = `${account.name} (${formatCurrency(account.balance || 0)})`;
                dropdown.appendChild(option);
            });
            
            // Restore previous selection if it still exists
            if (currentValue && accounts.find(acc => acc.id === currentValue)) {
                dropdown.value = currentValue;
            }
        }
    });
}

// Analytics and Performance
function renderAnalytics() {
    const container = document.getElementById('analyticsContent');
    if (!container) return;
    
    // Calculate analytics data
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalRevenue = investments.reduce((sum, inv) => sum + (inv.totalReturns || 0), 0);
    const totalProfit = totalRevenue - totalInvestment - totalExpenses;
    
    // Monthly breakdown
    const monthlyData = getMonthlyBreakdown();
    
    container.innerHTML = `
        <div class="analytics-grid">
            <div class="analytics-card">
                <h4>Investment Performance</h4>
                <p><strong>Total Invested:</strong> ${formatCurrency(totalInvestment)}</p>
                <p><strong>Total Returns:</strong> ${formatCurrency(totalRevenue)}</p>
                <p><strong>Overall ROI:</strong> ${totalInvestment > 0 ? ((totalRevenue / totalInvestment) * 100).toFixed(1) : 0}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((totalRevenue / Math.max(totalInvestment, 1)) * 100, 100)}%"></div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h4>Expense Analysis</h4>
                <p><strong>Total Expenses:</strong> ${formatCurrency(totalExpenses)}</p>
                <p><strong>Monthly Average:</strong> ${formatCurrency(totalExpenses / Math.max(monthlyData.length, 1))}</p>
                <p><strong>Expense Ratio:</strong> ${totalRevenue > 0 ? ((totalExpenses / totalRevenue) * 100).toFixed(1) : 0}%</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min((totalExpenses / Math.max(totalRevenue, 1)) * 100, 100)}%"></div>
                </div>
            </div>
            
            <div class="analytics-card">
                <h4>Profitability</h4>
                <p><strong>Net Profit:</strong> ${formatCurrency(totalProfit)}</p>
                <p><strong>Profit Margin:</strong> ${totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}%</p>
                <p><strong>Break-even Status:</strong> ${totalProfit >= 0 ? 'Achieved' : 'Pending'}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${totalProfit >= 0 ? 100 : Math.max((totalRevenue / Math.max(totalInvestment + totalExpenses, 1)) * 100, 0)}%"></div>
                </div>
            </div>
        </div>
    `;
}

function getMonthlyBreakdown() {
    const months = {};
    
    // Process investments
    investments.forEach(investment => {
        const date = new Date(investment.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!months[monthKey]) {
            months[monthKey] = { investments: 0, expenses: 0, revenue: 0 };
        }
        
        months[monthKey].investments += investment.amount || 0;
        months[monthKey].revenue += investment.totalReturns || 0;
    });
    
    // Process expenses
    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!months[monthKey]) {
            months[monthKey] = { investments: 0, expenses: 0, revenue: 0 };
        }
        
        months[monthKey].expenses += expense.amount || 0;
    });
    
    return Object.entries(months).map(([month, data]) => ({
        month,
        ...data
    })).sort((a, b) => a.month.localeCompare(b.month));
}

function renderPerformance() {
    const container = document.getElementById('performanceContent');
    if (!container) return;
    
    if (investments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No investment data available for performance analysis.</p>
            </div>
        `;
        return;
    }
    
    // Calculate performance metrics for each investment
    const performanceData = investments.map(investment => {
        const roi = investment.amount > 0 ? ((investment.totalReturns || 0) / investment.amount * 100) : 0;
        const daysSinceStart = Math.floor((new Date() - new Date(investment.date)) / (1000 * 60 * 60 * 24));
        const dailyReturn = daysSinceStart > 0 ? (investment.totalReturns || 0) / daysSinceStart : 0;
        
        return {
            ...investment,
            roi,
            daysSinceStart,
            dailyReturn
        };
    }).sort((a, b) => b.roi - a.roi);
    
    container.innerHTML = `
        <div class="performance-summary">
            <div class="summary-card">
                <h3>Top Performer</h3>
                <p><strong>${performanceData[0]?.name || 'N/A'}</strong></p>
                <p>ROI: ${performanceData[0]?.roi.toFixed(1) || 0}%</p>
            </div>
            <div class="summary-card">
                <h3>Average ROI</h3>
                <p><strong>${(performanceData.reduce((sum, inv) => sum + inv.roi, 0) / performanceData.length).toFixed(1)}%</strong></p>
            </div>
            <div class="summary-card">
                <h3>Total Daily Returns</h3>
                <p><strong>${formatCurrency(performanceData.reduce((sum, inv) => sum + inv.dailyReturn, 0))}</strong></p>
            </div>
        </div>
        
        <div class="investments-list">
            ${performanceData.map(investment => `
                <div class="investment-item">
                    <div class="investment-header">
                        <div>
                            <h3 class="business-name">${investment.name || 'Unnamed Investment'}</h3>
                            <span class="business-type">${investment.type || 'General'}</span>
                        </div>
                    </div>
                    <div class="investment-details">
                        <div class="detail-item">
                            <div class="detail-label">Investment</div>
                            <div class="detail-value">${formatCurrency(investment.amount || 0)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Returns</div>
                            <div class="detail-value">${formatCurrency(investment.totalReturns || 0)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">ROI</div>
                            <div class="detail-value ${investment.roi >= 0 ? 'positive' : 'negative'}">
                                <i class="fas ${investment.roi >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'}"></i> ${investment.roi.toFixed(1)}%
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Daily Return</div>
                            <div class="detail-value">${formatCurrency(investment.dailyReturn)}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Audit Logs
function initializeAuditLogs() {
    // Set up filter event listeners
    const filterForm = document.getElementById('auditFilterForm');
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loadAuditLogs();
        });
    }
    
    // Set up clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            document.getElementById('auditFilterForm').reset();
            loadAuditLogs();
        });
    }
}

async function loadAuditLogs() {
    try {
        showLoadingState(true);
        
        // Get filter values
        const filters = {
            table_name: document.getElementById('tableFilter')?.value || '',
            action: document.getElementById('actionFilter')?.value || '',
            from_date: document.getElementById('fromDate')?.value || '',
            to_date: document.getElementById('toDate')?.value || ''
        };
        
        const auditLogs = await apiService.getAuditLogs(filters);
        renderAuditLogs(auditLogs);
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        apiService.handleError(error, 'Loading audit logs');
    } finally {
        showLoadingState(false);
    }
}

function renderAuditLogs(auditLogs) {
    const container = document.getElementById('auditLogsList');
    if (!container) return;
    
    if (!auditLogs || auditLogs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <p>No audit logs found for the selected criteria.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = auditLogs.map(log => {
        const actionClass = getActionClass(log.action);
        const actionIcon = getActionIcon(log.action);
        
        return `
            <div class="audit-log-item">
                <div class="audit-icon ${actionClass}">
                    <i class="fas ${actionIcon}"></i>
                </div>
                <div class="audit-details">
                    <div class="audit-action">
                        <strong>${log.action.toUpperCase()}</strong> on ${log.table_name}
                    </div>
                    <div class="audit-meta">
                        ${log.user_id ? `User ID: ${log.user_id} • ` : ''}${formatDateTime(log.created_at)}
                    </div>
                    ${log.old_values || log.new_values ? `
                        <div class="audit-changes">
                            ${log.old_values ? `<div><strong>Old:</strong> ${JSON.stringify(log.old_values)}</div>` : ''}
                            ${log.new_values ? `<div><strong>New:</strong> ${JSON.stringify(log.new_values)}</div>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getActionClass(action) {
    switch (action.toLowerCase()) {
        case 'created': return 'created';
        case 'updated': return 'updated';
        case 'deleted': return 'deleted';
        default: return 'other';
    }
}

function getActionIcon(action) {
    switch (action.toLowerCase()) {
        case 'created': return 'fa-plus';
        case 'updated': return 'fa-edit';
        case 'deleted': return 'fa-trash';
        default: return 'fa-history';
    }
}

// Utility Functions
function formatCurrency(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) {
        return 'TSh 0';
    }
    return `TSh ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatNumber(number, decimals = 0) {
    if (isNaN(number) || number === null || number === undefined) {
        return '0';
    }
    return Number(number).toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function getNumericValue(element) {
    if (!element) return 0;
    const value = typeof element === 'string' ? element : element.value;
    const numericValue = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
}

// Button Event Listeners Setup
function setupButtonEventListeners() {
    // Investment buttons
    const addInvestmentBtn = document.getElementById('addInvestmentBtn');
    if (addInvestmentBtn) {
        addInvestmentBtn.addEventListener('click', showAddInvestment);
    }
    
    // Expense buttons
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', showAddExpense);
    }
    
    // Account buttons
    const addAccountBtn = document.getElementById('addAccountBtn');
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', showAddAccount);
    }
    
    // Transaction buttons
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => showAddTransaction());
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

// Business dropdown population
function populateBusinessDropdown() {
    const dropdown = document.getElementById('businessName');
    if (!dropdown) return;
    
    // Get unique business names from investments
    const businessNames = [...new Set(investments.map(inv => inv.name).filter(name => name))];
    
    // Clear existing datalist options
    let datalist = document.getElementById('businessNameList');
    if (!datalist) {
        datalist = document.createElement('datalist');
        datalist.id = 'businessNameList';
        dropdown.setAttribute('list', 'businessNameList');
        dropdown.parentNode.appendChild(datalist);
    }
    
    datalist.innerHTML = businessNames.map(name => `<option value="${name}">`).join('');
}

// Function to populate investment dropdown
function populateInvestmentDropdown() {
    const investmentSelect = document.getElementById('relatedInvestment');
    if (!investmentSelect) return;
    
    // Clear existing options except the first one
    investmentSelect.innerHTML = '<option value="">Select Investment</option>';
    
    // Add investment options
    if (investments && investments.length > 0) {
        investments.forEach(investment => {
            const option = document.createElement('option');
            option.value = investment.id;
            option.textContent = `${investment.name} - $${formatCurrency(investment.amount)}`;
            investmentSelect.appendChild(option);
        });
    }
}

// Dashboard Performance Summary
function updateDashboardPerformance() {
    const container = document.getElementById('dashboardPerformance');
    if (!container) return;
    
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalRevenue = investments.reduce((sum, inv) => sum + (inv.totalReturns || 0), 0);
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    
    container.innerHTML = `
        <div class="performance-summary">
            <div class="summary-card">
                <h4>Investment Performance</h4>
                <p>Total Invested: ${formatCurrency(totalInvestment)}</p>
                <p>Total Returns: ${formatCurrency(totalRevenue)}</p>
                <p>ROI: ${totalInvestment > 0 ? ((totalRevenue / totalInvestment) * 100).toFixed(1) : 0}%</p>
            </div>
            <div class="summary-card">
                <h4>Financial Health</h4>
                <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
                <p>Total Expenses: ${formatCurrency(totalExpenses)}</p>
                <p>Net Profit: ${formatCurrency(netProfit)}</p>
            </div>
        </div>
    `;
}

// Performance Table Update
function updatePerformanceTable() {
    const tableBody = document.getElementById('performanceTableBody');
    if (!tableBody) return;
    
    if (investments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    No investment data available
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = investments.map(investment => {
        const roi = investment.roi || 0;
        const roiClass = roi >= 0 ? 'positive' : 'negative';
        const netProfit = investment.netProfit || 0;
        const netProfitClass = netProfit >= 0 ? 'positive' : 'negative';
        const breakEvenText = investment.breakEvenMonths 
            ? `${investment.breakEvenMonths.toFixed(1)} months` 
            : 'N/A';
        
        return `
            <tr>
                <td>${investment.name || 'Unnamed'}</td>
                <td>${investment.type || 'General'}</td>
                <td>${formatCurrency(investment.amount || 0)}</td>
                <td>${formatCurrency(investment.totalExpenses || 0)}</td>
                <td>${formatCurrency(investment.totalCost || investment.amount || 0)}</td>
                <td>${formatCurrency(investment.totalReturns || 0)}</td>
                <td class="${netProfitClass}">${formatCurrency(netProfit)}</td>
                <td class="${roiClass}">${roi.toFixed(1)}%</td>
                <td>${breakEvenText}</td>
            </tr>
        `;
    }).join('');
}