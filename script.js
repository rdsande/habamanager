// Data Storage - Now loaded from API
let investments = [];
let expenses = [];
let dailyRevenues = {};
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
        

        
        // Process and normalize investment data
        dailyRevenues = {};
        investments.forEach(investment => {
            // Map backend fields to frontend expected fields
            investment.totalReturns = investment.total_returns || investment.calculated_total_returns || 0;
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
    const navItems = document.querySelectorAll('.nav-item');
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
    
    document.getElementById('totalPortfolio').textContent = formatCurrency(totalPortfolio);
    document.getElementById('activeInvestments').textContent = activeInvestments;
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyExpenses);
    document.getElementById('monthlyROI').textContent = monthlyROI + '%';
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    
    // Update new balance displays
    document.getElementById('startingBalance').textContent = formatCurrency(startingBalance);
    document.getElementById('remainingBalance').textContent = formatCurrency(remainingBalance);
    
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
    const totalReturns = investments.reduce((total, inv) => total + (inv.totalReturns || 0), 0);
    
    if (totalInvested === 0 || isNaN(totalInvested) || isNaN(totalReturns)) return 0;
    const roi = (totalReturns / totalInvested) * 100;
    return isNaN(roi) ? 0 : roi.toFixed(1);
}

function calculateTotalRevenue() {
    return investments.reduce((total, inv) => total + (inv.totalReturns || 0), 0);
}

function calculateStartingBalance() {
    // Calculate starting balance from initial deposits minus withdrawals
    const totalDeposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    return totalDeposits;
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
    
    // Set modal title and button text for adding
    document.getElementById('investmentModalTitle').textContent = 'Add New Investment';
    document.getElementById('investmentSubmitBtn').textContent = 'Add Investment';
    
    // Set today's date as default
    document.getElementById('startDate').value = new Date().toISOString().split('T')[0];
    
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
document.getElementById('investmentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const editInvestmentId = document.getElementById('editInvestmentId').value;
    
    if (editInvestmentId) {
        await updateInvestment(editInvestmentId);
    } else {
        await addInvestment();
    }
});

async function addInvestment() {
    try {
        showLoadingState(true);
        
        const investmentData = {
            name: document.getElementById('businessName').value,
            type: document.getElementById('businessType').value,
            amount: getNumericValue(document.getElementById('investmentAmount')),
        expected_daily_revenue: getNumericValue(document.getElementById('dailyRevenue')),
            date: document.getElementById('startDate').value || new Date().toISOString().split('T')[0],
            account_id: document.getElementById('investmentAccount').value || null,
            notes: document.getElementById('investmentNotes').value || ''
        };
        
        const newInvestment = await apiService.createInvestment(investmentData);
        
        // Update local data
        investments.push(newInvestment);
        
        // Refresh account data if investment was funded from an account
        if (investmentData.account_id) {
            const updatedAccounts = await apiService.getAccounts();
            accounts.length = 0;
            accounts.push(...updatedAccounts);
            
            const updatedTransactions = await apiService.getTransactions();
            transactions.length = 0;
            transactions.push(...(updatedTransactions.transactions || updatedTransactions));
        }
        
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
    document.getElementById('dailyRevenue').value = investment.expected_daily_revenue || '';
    document.getElementById('startDate').value = investment.date || '';
    document.getElementById('investmentAccount').value = investment.account_id || '';
    document.getElementById('investmentNotes').value = investment.notes || '';
    
    // Update modal title and button text
    document.getElementById('investmentModalTitle').textContent = 'Edit Investment';
    document.getElementById('investmentSubmitBtn').textContent = 'Update Investment';
    
    // Show modal
    document.getElementById('investmentModal').classList.add('show');
}

async function updateInvestment(investmentId) {
    try {
        showLoadingState(true);
        
        const investmentData = {
            name: document.getElementById('businessName').value,
            type: document.getElementById('businessType').value,
            amount: getNumericValue(document.getElementById('investmentAmount')),
            date: document.getElementById('startDate').value,
            account_id: document.getElementById('investmentAccount').value || null,
            expected_daily_revenue: getNumericValue(document.getElementById('dailyRevenue')),
            notes: document.getElementById('investmentNotes').value || ''
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
        document.getElementById('editInvestmentId').value = '';
        
        apiService.showSuccessMessage('Investment updated successfully!');
        
    } catch (error) {
        console.error('Error updating investment:', error);
        apiService.handleError(error, 'Updating investment');
    } finally {
        showLoadingState(false);
    }
}

async function deleteInvestment(investmentId) {
    if (!confirm('Are you sure you want to delete this investment? This action cannot be undone and will also delete all associated daily revenues.')) {
        return;
    }

    try {
        showLoadingState(true);
        
        const response = await fetch(`/api/investments/${investmentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete investment');
        }

        // Remove from local array
        const index = investments.findIndex(inv => inv.id === investmentId);
        if (index !== -1) {
            investments.splice(index, 1);
        }

        // Update UI
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
    
    if (investments.length === 0) {
        container.innerHTML = '<div class="empty-state">No investments yet. Add your first investment to get started!</div>';
        return;
    }
    
    container.innerHTML = investments.map(investment => {
        const totalReturns = investment.totalReturns || 0;
        const amount = investment.amount || 0;
        const roi = amount > 0 && !isNaN(totalReturns) && !isNaN(amount) ? formatNumber(((totalReturns / amount) * 100), 1) : '0.0';
        const breakEvenMonths = calculateBreakEvenMonths(investment);
        const dailyAverage = calculateDailyAverage(investment);
        
        return `
            <div class="investment-item">
                <div class="investment-header">
                    <span class="business-name">${investment.name}</span>
                    <span class="business-type">${investment.type}</span>
                </div>
                <p class="investment-description">${investment.description || 'No description provided'}</p>
                <div class="investment-details">
                    <div class="detail-item">
                        <div class="detail-label">Investment</div>
                        <div class="detail-value">${formatCurrency(investment.amount)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Returns</div>
                        <div class="detail-value">${formatCurrency(investment.totalReturns)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">ROI</div>
                        <div class="detail-value">${roi}%</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Daily Avg</div>
                        <div class="detail-value">${formatCurrency(dailyAverage)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Break Even</div>
                        <div class="detail-value">${breakEvenMonths} months</div>
                    </div>
                </div>
                <div class="investment-actions">
                    <button class="action-btn" data-action="add-revenue" data-investment-id="${investment.id}">Add Revenue</button>
                    <button class="action-btn" data-action="view-details" data-investment-id="${investment.id}">View Details</button>
                    <button class="action-btn edit-btn" data-action="edit-investment" data-investment-id="${investment.id}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-investment" data-investment-id="${investment.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Bulk delete all transactions
async function bulkDeleteTransactions() {
    if (!confirm('Are you sure you want to delete ALL transactions? This action cannot be undone and will reset all balance calculations.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/transactions/bulk', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete transactions');
        }
        
        const result = await response.json();
        
        // Show success message
        alert(`Successfully deleted ${result.deletedCount} transactions`);
        
        // Refresh all data to reflect the changes
        await loadAllData();
        
    } catch (error) {
        console.error('Error deleting transactions:', error);
        alert('Failed to delete transactions. Please try again.');
    }
}

// Audit Logs Functionality
let currentAuditPage = 1;
const auditLogsPerPage = 20;

async function loadAuditLogs(page = 1) {
    try {
        showLoadingState(true);
        
        const tableFilter = document.getElementById('auditTableFilter').value;
        const actionFilter = document.getElementById('auditActionFilter').value;
        
        const params = new URLSearchParams({
            page: page,
            limit: auditLogsPerPage
        });
        
        if (tableFilter) params.append('table_name', tableFilter);
        if (actionFilter) params.append('action', actionFilter);
        
        const response = await fetch(`/api/audit-logs?${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch audit logs');
        }
        
        const data = await response.json();
        currentAuditPage = page;
        
        renderAuditLogs(data.logs || []);
        updateAuditPagination(data.totalPages || 1, page);
        
    } catch (error) {
        console.error('Error loading audit logs:', error);
        document.getElementById('auditLogsList').innerHTML = 
            '<div class="empty-audit-logs">Failed to load audit logs. Please try again.</div>';
    } finally {
        showLoadingState(false);
    }
}

function renderAuditLogs(logs) {
    const container = document.getElementById('auditLogsList');
    
    if (!logs || logs.length === 0) {
        container.innerHTML = '<div class="empty-audit-logs">No audit logs found.</div>';
        return;
    }
    
    container.innerHTML = logs.map(log => {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const details = getAuditLogDetails(log);
        
        return `
            <div class="audit-log-item">
                <div class="audit-log-main">
                    <span class="audit-log-action ${log.action}">${log.action}</span>
                    <span class="audit-log-table">${formatTableName(log.table_name)}</span>
                    <div class="audit-log-details">${details}</div>
                </div>
                <div class="audit-log-timestamp">${timestamp}</div>
            </div>
        `;
    }).join('');
}

function getAuditLogDetails(log) {
    try {
        const oldValues = log.old_values ? JSON.parse(log.old_values) : null;
        const newValues = log.new_values ? JSON.parse(log.new_values) : null;
        
        if (log.action === 'CREATE') {
            let details = `Created new ${formatTableName(log.table_name).toLowerCase()}`;
            
            // Add amount information for CREATE operations
            if (newValues) {
                if (log.table_name === 'investments' && newValues.investment_amount) {
                    details += ` - Amount: $${formatNumber(newValues.investment_amount, 2)}`;
                } else if (log.table_name === 'daily_revenues' && newValues.revenue_amount) {
                    details += ` - Revenue: $${formatNumber(newValues.revenue_amount, 2)}`;
                } else if (log.table_name === 'expenses' && newValues.expense_amount) {
                    details += ` - Amount: $${formatNumber(newValues.expense_amount, 2)}`;
                } else if (log.table_name === 'accounts' && newValues.initial_balance) {
                    details += ` - Initial Balance: $${formatNumber(newValues.initial_balance, 2)}`;
                } else if (log.table_name === 'transactions' && newValues.amount) {
                    const type = newValues.transaction_type || 'Transaction';
                    details += ` - ${type}: $${formatNumber(newValues.amount, 2)}`;
                }
            }
            
            return details;
        } else if (log.action === 'DELETE') {
            const name = oldValues?.business_name || oldValues?.account_name || oldValues?.description || `ID: ${log.record_id}`;
            let details = `Deleted ${formatTableName(log.table_name).toLowerCase()}: ${name}`;
            
            // Add amount information for DELETE operations
            if (oldValues) {
                if (log.table_name === 'investments' && oldValues.investment_amount) {
                    details += ` - Amount: $${formatNumber(oldValues.investment_amount, 2)}`;
                } else if (log.table_name === 'daily_revenues' && oldValues.revenue_amount) {
                    details += ` - Revenue: $${formatNumber(oldValues.revenue_amount, 2)}`;
                } else if (log.table_name === 'expenses' && oldValues.expense_amount) {
                    details += ` - Amount: $${formatNumber(oldValues.expense_amount, 2)}`;
                } else if (log.table_name === 'accounts' && oldValues.initial_balance) {
                    details += ` - Balance: $${formatNumber(oldValues.initial_balance, 2)}`;
                }
            }
            
            return details;
        } else if (log.action === 'UPDATE') {
            let details = `Updated ${formatTableName(log.table_name).toLowerCase()}`;
            
            // Add amount change information for UPDATE operations
            if (oldValues && newValues) {
                if (log.table_name === 'investments') {
                    if (oldValues.investment_amount !== newValues.investment_amount) {
                        details += ` - Amount: $${formatNumber(oldValues.investment_amount, 2)} → $${formatNumber(newValues.investment_amount, 2)}`;
                    }
                } else if (log.table_name === 'daily_revenues') {
                    if (oldValues.revenue_amount !== newValues.revenue_amount) {
                        details += ` - Revenue: $${formatNumber(oldValues.revenue_amount, 2)} → $${formatNumber(newValues.revenue_amount, 2)}`;
                    }
                } else if (log.table_name === 'expenses') {
                    if (oldValues.expense_amount !== newValues.expense_amount) {
                        details += ` - Amount: $${formatNumber(oldValues.expense_amount, 2)} → $${formatNumber(newValues.expense_amount, 2)}`;
                    }
                } else if (log.table_name === 'accounts') {
                    if (oldValues.initial_balance !== newValues.initial_balance) {
                        details += ` - Balance: $${formatNumber(oldValues.initial_balance, 2)} → $${formatNumber(newValues.initial_balance, 2)}`;
                    }
                }
            }
            
            return details;
        }
        
        return `${log.action} operation on ${formatTableName(log.table_name).toLowerCase()}`;
    } catch (error) {
        return `${log.action} operation on ${formatTableName(log.table_name).toLowerCase()}`;
    }
}

function formatTableName(tableName) {
    const tableNames = {
        'investments': 'Investment',
        'accounts': 'Account',
        'expenses': 'Expense',
        'daily_revenues': 'Daily Revenue',
        'transactions': 'Transaction'
    };
    return tableNames[tableName] || tableName;
}

function updateAuditPagination(totalPages, currentPage) {
    const prevBtn = document.getElementById('prevAuditPage');
    const nextBtn = document.getElementById('nextAuditPage');
    const pageInfo = document.getElementById('auditPageInfo');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function initializeAuditLogs() {
    // Filter change handlers
    document.getElementById('auditTableFilter').addEventListener('change', () => {
        loadAuditLogs(1);
    });
    
    document.getElementById('auditActionFilter').addEventListener('change', () => {
        loadAuditLogs(1);
    });
    
    // Refresh button
    document.getElementById('refreshAuditLogs').addEventListener('click', () => {
        loadAuditLogs(currentAuditPage);
    });
    
    // Pagination buttons
    document.getElementById('prevAuditPage').addEventListener('click', () => {
        if (currentAuditPage > 1) {
            loadAuditLogs(currentAuditPage - 1);
        }
    });
    
    document.getElementById('nextAuditPage').addEventListener('click', () => {
        loadAuditLogs(currentAuditPage + 1);
    });
}

// Setup all button event listeners
function setupButtonEventListeners() {
    // Add Investment buttons
    const addInvestmentBtn = document.getElementById('addInvestmentBtn');
    const addInvestmentBtn2 = document.getElementById('addInvestmentBtn2');
    if (addInvestmentBtn) addInvestmentBtn.addEventListener('click', showAddInvestment);
    if (addInvestmentBtn2) addInvestmentBtn2.addEventListener('click', showAddInvestment);
    
    // Add Expense buttons
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const addExpenseBtn2 = document.getElementById('addExpenseBtn2');
    if (addExpenseBtn) addExpenseBtn.addEventListener('click', showAddExpense);
    if (addExpenseBtn2) addExpenseBtn2.addEventListener('click', showAddExpense);
    
    // Add Account button
    const addAccountBtn = document.getElementById('addAccountBtn');
    if (addAccountBtn) addAccountBtn.addEventListener('click', showAddAccount);
    
    // Bulk delete transactions button
    const bulkDeleteTransactionsBtn = document.getElementById('bulkDeleteTransactionsBtn');
    if (bulkDeleteTransactionsBtn) bulkDeleteTransactionsBtn.addEventListener('click', bulkDeleteTransactions);
    
    // View All Performance link
    const viewAllPerformanceLink = document.getElementById('viewAllPerformanceLink');
    if (viewAllPerformanceLink) {
        viewAllPerformanceLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('[data-tab=performance]').click();
        });
    }
    
    // Transaction filter dropdowns
    const accountFilter = document.getElementById('accountFilter');
    const transactionTypeFilter = document.getElementById('transactionTypeFilter');
    if (accountFilter) accountFilter.addEventListener('change', filterTransactions);
    if (transactionTypeFilter) transactionTypeFilter.addEventListener('change', filterTransactions);
    
    // Modal close buttons
    const closeInvestmentModal = document.getElementById('closeInvestmentModal');
    const closeExpenseModal = document.getElementById('closeExpenseModal');
    const closeAccountModal = document.getElementById('closeAccountModal');
    const closeDepositModal = document.getElementById('closeDepositModal');
    const closeWithdrawalModal = document.getElementById('closeWithdrawalModal');
    const closeRevenueModal = document.getElementById('closeRevenueModal');
    const closeInvestmentDetailsModal = document.getElementById('closeInvestmentDetailsModal');
    
    if (closeInvestmentModal) closeInvestmentModal.addEventListener('click', () => closeModal('investmentModal'));
    if (closeExpenseModal) closeExpenseModal.addEventListener('click', () => closeModal('expenseModal'));
    if (closeAccountModal) closeAccountModal.addEventListener('click', () => closeModal('accountModal'));
    if (closeDepositModal) closeDepositModal.addEventListener('click', () => closeModal('depositModal'));
    if (closeWithdrawalModal) closeWithdrawalModal.addEventListener('click', () => closeModal('withdrawalModal'));
    if (closeRevenueModal) closeRevenueModal.addEventListener('click', () => closeModal('revenueModal'));
    if (closeInvestmentDetailsModal) closeInvestmentDetailsModal.addEventListener('click', () => closeModal('investmentDetailsModal'));
    
    // Event delegation for dynamically generated buttons
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-action="add-revenue"]')) {
            const investmentId = e.target.getAttribute('data-investment-id');
            addRevenue(investmentId);
        } else if (e.target.matches('[data-action="view-details"]')) {
            const investmentId = e.target.getAttribute('data-investment-id');
            viewDetails(investmentId);
        } else if (e.target.matches('[data-action="deposit"]')) {
            const accountId = e.target.getAttribute('data-account-id');
            showAddDeposit();
            document.getElementById('depositAccount').value = accountId;
        } else if (e.target.matches('[data-action="withdraw"]')) {
            const accountId = e.target.getAttribute('data-account-id');
            showAddWithdrawal();
            document.getElementById('withdrawalAccount').value = accountId;
        } else if (e.target.matches('[data-action="edit"]')) {
            const accountId = e.target.getAttribute('data-account-id');
            showEditAccount(accountId);
        } else if (e.target.matches('[data-action="delete-account"]')) {
            const accountId = e.target.getAttribute('data-account-id');
            deleteAccount(accountId);
        } else if (e.target.matches('[data-action="edit-expense"]')) {
            const expenseId = e.target.getAttribute('data-expense-id');

            showEditExpense(expenseId);
        } else if (e.target.matches('[data-action="delete-expense"]')) {
            const expenseId = e.target.getAttribute('data-expense-id');
            deleteExpense(expenseId);
        } else if (e.target.matches('[data-action="edit-investment"]')) {
            const investmentId = e.target.getAttribute('data-investment-id');

            showEditInvestment(investmentId);
        } else if (e.target.matches('[data-action="delete-investment"]')) {
            const investmentId = e.target.getAttribute('data-investment-id');
            deleteInvestment(investmentId);
        } else if (e.target.matches('[data-action="edit-revenue"]')) {
            const revenueId = e.target.getAttribute('data-revenue-id');
            const investmentId = e.target.getAttribute('data-investment-id');
            showEditRevenue(revenueId, investmentId);
        }
    });
}

// Performance Functions
function calculateBusinessPerformance() {
    return investments.map(investment => {
        const totalInvested = investment.amount;
        const totalReturns = investment.totalReturns || 0;
        const roi = totalInvested > 0 ? ((totalReturns / totalInvested) * 100) : 0;
        const profit = totalReturns - totalInvested;
        const isBreakEven = totalReturns >= totalInvested;
        const breakEvenProgress = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
        
        // Calculate days since investment
        const startDate = new Date(investment.date);
        const currentDate = new Date();
        const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
        const dailyAverage = daysSinceStart > 0 ? totalReturns / daysSinceStart : 0;
        
        return {
            id: investment.id,
            name: investment.name,
            totalInvested,
            totalReturns,
            profit,
            roi: parseFloat(roi.toFixed(2)),
            isBreakEven,
            breakEvenProgress: Math.min(breakEvenProgress, 100),
            dailyAverage: parseFloat(dailyAverage.toFixed(2)),
            daysSinceStart,
            date: investment.date
        };
    }).sort((a, b) => b.roi - a.roi); // Sort by ROI descending
}

function getBestPerformer() {
    const performances = calculateBusinessPerformance();
    return performances.length > 0 ? performances[0] : null;
}

function getOverallROI() {
    const totalInvested = investments.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.totalReturns || 0), 0);
    
    if (totalInvested <= 0 || isNaN(totalInvested) || isNaN(totalReturns)) return '0.00';
    const roi = (totalReturns / totalInvested) * 100;
    return isNaN(roi) ? '0.00' : roi.toFixed(2);
}

function getBreakEvenStatus() {
    const performances = calculateBusinessPerformance();
    const breakEvenCount = performances.filter(p => p.isBreakEven).length;
    const totalCount = performances.length;
    return totalCount > 0 ? `${breakEvenCount}/${totalCount} businesses` : '0/0 businesses';
}

function renderPerformance() {
    const performances = calculateBusinessPerformance();
    const bestPerformer = getBestPerformer();
    const overallROI = getOverallROI();
    const breakEvenStatus = getBreakEvenStatus();
    
    // Update summary cards
    document.getElementById('bestPerformer').textContent = bestPerformer ? bestPerformer.name : 'No data';
    document.getElementById('totalROI').textContent = overallROI + '%';
    document.getElementById('breakEvenStatus').textContent = breakEvenStatus;
    
    // Render performance list
    const container = document.getElementById('performanceList');
    
    if (performances.length === 0) {
        container.innerHTML = '<div class="empty-state">No investments found. Add your first investment to see performance data!</div>';
        return;
    }
    
    container.innerHTML = performances.map((perf, index) => {
        const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : '';
        const profitClass = perf.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const roiClass = perf.roi >= 0 ? 'roi-positive' : 'roi-negative';
        
        return `
            <div class="performance-item ${rankClass}">
                <div class="performance-rank">
                    <span class="rank-number">#${index + 1}</span>
                    ${index < 3 ? `<i class="fas fa-trophy rank-icon"></i>` : ''}
                </div>
                <div class="performance-details">
                    <div class="performance-header">
                        <h3 class="business-name">${perf.name}</h3>
                        <div class="performance-badges">
                            ${perf.isBreakEven ? '<span class="badge break-even">Break-even</span>' : '<span class="badge not-break-even">Below break-even</span>'}
                        </div>
                    </div>
                    <div class="performance-metrics">
                        <div class="metric">
                            <span class="metric-label">Invested:</span>
                            <span class="metric-value">${formatCurrency(perf.totalInvested)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Returns:</span>
                            <span class="metric-value">${formatCurrency(perf.totalReturns)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Profit:</span>
                            <span class="metric-value ${profitClass}">${formatCurrency(perf.profit)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">ROI:</span>
                            <span class="metric-value ${roiClass}">${formatNumber(perf.roi, 1)}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Daily Avg:</span>
                            <span class="metric-value">${formatCurrency(perf.dailyAverage)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Days Active:</span>
                            <span class="metric-value">${perf.daysSinceStart}</span>
                        </div>
                    </div>
                    <div class="break-even-progress">
                        <div class="progress-label">Break-even Progress: ${formatNumber(perf.breakEvenProgress, 1)}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(perf.breakEvenProgress, 100)}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function calculateDailyAverage(investment) {
    if (!investment.dailyRevenues || investment.dailyRevenues.length === 0) return 0;
    
    const total = investment.dailyRevenues.reduce((sum, rev) => sum + rev.amount, 0);
    return total / investment.dailyRevenues.length;
}

function calculateBreakEvenMonths(investment) {
    const dailyAvg = calculateDailyAverage(investment);
    if (dailyAvg <= 0 || isNaN(dailyAvg)) return '∞';
    
    const monthlyAvg = dailyAvg * 30;
    const amount = investment.amount || 0;
    const totalReturns = investment.totalReturns || 0;
    const remainingAmount = amount - totalReturns;
    
    if (remainingAmount <= 0 || isNaN(remainingAmount)) return 'Achieved';
    
    const months = Math.ceil(remainingAmount / monthlyAvg);
    return isNaN(months) ? '∞' : months;
}

async function addRevenue(investmentId) {
    const amount = prompt('Enter revenue amount for today:');
    const accountId = prompt('Enter account ID to deposit to (leave empty to skip):');
    
    if (amount && !isNaN(amount)) {
        try {
            showLoadingState(true);
            
            const revenueData = {
                amount: parseFloat(amount),
                date: new Date().toISOString().split('T')[0],
                account_id: accountId || null
            };
            
            await apiService.addDailyRevenue(investmentId, revenueData);
            
            // Refresh investment data
            const updatedInvestments = await apiService.getInvestments();
            investments.length = 0;
            investments.push(...updatedInvestments);
            
            // Refresh account and transaction data if revenue was deposited
            if (accountId) {
                const updatedAccounts = await apiService.getAccounts();
                accounts.length = 0;
                accounts.push(...updatedAccounts);
                
                const updatedTransactions = await apiService.getTransactions();
                transactions.length = 0;
                transactions.push(...(updatedTransactions.transactions || updatedTransactions));
                
                updateAccountsDisplay();
                updateTransactionsDisplay();
            }
            
            renderInvestments();
            updateDashboard();
            
            apiService.showSuccessMessage('Revenue added successfully!');
            
        } catch (error) {
            console.error('Error adding revenue:', error);
            apiService.handleError(error, 'Adding revenue');
        } finally {
            showLoadingState(false);
        }
    }
}

function viewDetails(investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment) {
        console.error('Investment not found:', investmentId);
        return;
    }
    
    // Populate investment basic info
    const basicInfoHtml = `
        <p><strong>Business Name:</strong> ${investment.name}</p>
        <p><strong>Type:</strong> ${investment.type}</p>
        <p><strong>Investment Amount:</strong> ${formatCurrency(investment.amount)}</p>
        <p><strong>Expected Daily Revenue:</strong> ${formatCurrency(investment.expected_daily_revenue || 0)}</p>
        <p><strong>Start Date:</strong> ${investment.date}</p>
        <p><strong>Total Returns:</strong> ${formatCurrency(investment.totalReturns || 0)}</p>
        ${investment.notes ? `<p><strong>Notes:</strong> ${investment.notes}</p>` : ''}
    `;
    document.getElementById('investmentBasicInfo').innerHTML = basicInfoHtml;
    
    // Populate daily revenues list
    const dailyRevenues = investment.dailyRevenues || [];
    let revenuesHtml = '';
    
    if (dailyRevenues.length === 0) {
        revenuesHtml = '<div class="empty-state">No daily revenues recorded yet.</div>';
    } else {
        revenuesHtml = dailyRevenues.map(revenue => `
            <div class="revenue-item">
                <div class="revenue-info">
                    <span class="revenue-date">${revenue.date}</span>
                    <span class="revenue-amount">${formatCurrency(revenue.amount)}</span>
                    ${revenue.notes ? `<span class="revenue-notes">${revenue.notes}</span>` : ''}
                </div>
                <div class="revenue-actions">
                    <button class="action-btn edit-btn" data-action="edit-revenue" data-revenue-id="${revenue.id}" data-investment-id="${investmentId}">Edit</button>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('dailyRevenuesList').innerHTML = revenuesHtml;
    
    // Show modal
    document.getElementById('investmentDetailsModal').classList.add('show');
}

function showEditRevenue(revenueId, investmentId) {
    const investment = investments.find(inv => inv.id === investmentId);
    if (!investment || !investment.dailyRevenues) {
        console.error('Investment or daily revenues not found');
        return;
    }
    
    const revenue = investment.dailyRevenues.find(rev => rev.id === revenueId);
    if (!revenue) {
        console.error('Revenue not found:', revenueId);
        return;
    }
    
    // Create a simple edit form using prompt for now (can be enhanced with a proper modal later)
    const newAmount = prompt(`Edit revenue amount for ${revenue.date}:`, revenue.amount);
    if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
        updateRevenue(revenueId, investmentId, {
            amount: parseFloat(newAmount),
            date: revenue.date,
            notes: revenue.notes || ''
        });
    }
}

async function updateRevenue(revenueId, investmentId, revenueData) {
    try {
        showLoadingState(true);
        
        // Call API to update revenue (this endpoint needs to be implemented in backend)
        const updatedRevenue = await apiService.updateDailyRevenue(revenueId, revenueData);
        
        // Update local data
        const investment = investments.find(inv => inv.id === investmentId);
        if (investment && investment.dailyRevenues) {
            const revenueIndex = investment.dailyRevenues.findIndex(rev => rev.id === revenueId);
            if (revenueIndex !== -1) {
                investment.dailyRevenues[revenueIndex] = updatedRevenue;
            }
        }
        
        // Refresh displays
        renderInvestments();
        updateDashboard();
        
        // Refresh the details modal if it's open
        if (document.getElementById('investmentDetailsModal').classList.contains('show')) {
            viewDetails(investmentId);
        }
        
        apiService.showSuccessMessage('Revenue updated successfully!');
        
    } catch (error) {
        console.error('Error updating revenue:', error);
        apiService.handleError(error, 'Updating revenue');
    } finally {
        showLoadingState(false);
    }
}

// Expense Management
function showAddExpense() {
    // Reset form for adding new expense
    document.getElementById('expenseForm').reset();
    document.getElementById('editExpenseId').value = '';
    document.getElementById('expenseModalTitle').textContent = 'Add Expense';
    document.getElementById('expenseSubmitBtn').textContent = 'Add Expense';
    
    // Set today's date as default
    document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    
    const modal = document.getElementById('expenseModal');
    if (modal) {
        modal.classList.add('show');
        populateBusinessDropdown();
        populateAccountDropdowns();
    }
}

document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const editExpenseId = document.getElementById('editExpenseId').value;
    
    if (editExpenseId) {
        await updateExpense(editExpenseId);
    } else {
        await addExpense();
    }
});

async function addExpense() {
    try {
        showLoadingState(true);
        
        const expenseData = {
            description: document.getElementById('expenseDescription').value,
            amount: getNumericValue(document.getElementById('expenseAmount')),
            category: document.getElementById('expenseCategory').value,
            business_name: document.getElementById('relatedBusiness').value,
            date: document.getElementById('expenseDate').value,
            account_id: document.getElementById('expenseAccount').value || null
        };
        
        const newExpense = await apiService.createExpense(expenseData);
        
        // Update local data
        expenses.push(newExpense);
        
        // Refresh account and transaction data if expense was paid from an account
        if (expenseData.account_id) {
            const updatedAccounts = await apiService.getAccounts();
            accounts.length = 0;
            accounts.push(...updatedAccounts);
            
            const updatedTransactions = await apiService.getTransactions();
            transactions.length = 0;
            transactions.push(...(updatedTransactions.transactions || updatedTransactions));
            
            updateAccountsDisplay();
            updateTransactionsDisplay();
        }
        
        // Update displays
        renderExpenses();
        updateDashboard();
        
        // Close modal and reset form
        closeModal('expenseModal');
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
        alert('Expense not found');
        return;
    }
    
    // Pre-fill form with expense data
    document.getElementById('editExpenseId').value = expense.id;
    document.getElementById('expenseDescription').value = expense.description;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.category;
    document.getElementById('expenseAccount').value = expense.account_id || '';
    document.getElementById('relatedBusiness').value = expense.business_name || '';
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseNotes').value = expense.notes || '';
    
    // Update modal title and button text
    document.getElementById('expenseModalTitle').textContent = 'Edit Expense';
    document.getElementById('expenseSubmitBtn').textContent = 'Update Expense';
    
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
            amount: getNumericValue(document.getElementById('expenseAmount')),
            category: document.getElementById('expenseCategory').value,
            business_name: document.getElementById('relatedBusiness').value,
            date: document.getElementById('expenseDate').value,
            account_id: document.getElementById('expenseAccount').value || null,
            notes: document.getElementById('expenseNotes').value
        };
        
        const updatedExpense = await apiService.updateExpense(expenseId, expenseData);
        
        // Update local data
        const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex !== -1) {
            expenses[expenseIndex] = updatedExpense;
        }
        
        // Refresh displays
        renderExpenses();
        updateDashboard();
        
        // Close modal and reset form
        closeModal('expenseModal');
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
        
        const response = await fetch(`/api/expenses/${expenseId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete expense');
        }

        // Remove from local array
        const index = expenses.findIndex(exp => exp.id === expenseId);
        if (index !== -1) {
            expenses.splice(index, 1);
        }

        // Update UI
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
    const filter = document.getElementById('expenseFilter').value;
    
    let filteredExpenses = filterExpenses(expenses, filter);
    
    if (filteredExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state">No expenses found for the selected period.</div>';
        return;
    }
    
    container.innerHTML = filteredExpenses.map(expense => {
        const businessName = expense.relatedBusiness ? 
            investments.find(inv => inv.id === expense.relatedBusiness)?.name || 'Unknown Business' : 
            'General';
        
        return `
            <div class="expense-item">
                <div class="expense-header">
                    <span class="expense-description">${expense.description}</span>
                    <span class="expense-amount">${formatCurrency(expense.amount)}</span>
                </div>
                <div class="expense-details">
                    <span class="expense-category">${expense.category}</span>
                    <span class="expense-business">${businessName}</span>
                    <span class="expense-date">${formatDate(expense.date)}</span>
                </div>
                <div class="expense-actions">
                    <button class="action-btn edit-btn" data-action="edit-expense" data-expense-id="${expense.id}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-expense" data-expense-id="${expense.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function filterExpenses(expenses, filter) {
    const now = new Date();
    
    switch(filter) {
        case 'today':
            return expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.toDateString() === now.toDateString();
            });
        case 'week':
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            return expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= weekStart;
            });
        case 'month':
            return expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
            });
        default:
            return expenses;
    }
}

// Analytics
function renderAnalytics() {
    const container = document.getElementById('analyticsContent');
    
    if (investments.length === 0) {
        container.innerHTML = '<p>Add some investments to see analytics.</p>';
        return;
    }
    
    const analyticsData = generateAnalyticsData();
    
    container.innerHTML = `
        <h3>Performance Overview</h3>
        <div class="analytics-grid">
            ${analyticsData.map(data => `
                <div class="analytics-card">
                    <h4>${data.businessName}</h4>
                    <p><strong>Investment:</strong> ${formatCurrency(data.investment)}</p>
                    <p><strong>Returns:</strong> ${formatCurrency(data.returns)}</p>
                    <p><strong>ROI:</strong> ${data.roi}%</p>
                    <p><strong>Break Even:</strong> ${data.breakEven}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(data.progressPercent, 100)}%"></div>
                    </div>
                    <p><strong>Progress:</strong> ${formatNumber(data.progressPercent, 1)}%</p>
                </div>
            `).join('')}
        </div>
    `;
}

function generateAnalyticsData() {
    return investments.map(investment => {
        const roi = investment.amount > 0 ? ((investment.totalReturns / investment.amount) * 100) : 0;
        const progressPercent = investment.amount > 0 ? ((investment.totalReturns / investment.amount) * 100) : 0;
        const breakEven = calculateBreakEvenMonths(investment);
        
        return {
            businessName: investment.name,
            investment: investment.amount,
            returns: investment.totalReturns || 0,
            roi: roi.toFixed(1),
            breakEven: breakEven + (typeof breakEven === 'number' ? ' months' : ''),
            progressPercent: progressPercent
        };
    });
}

// Utility Functions
function populateBusinessDropdown() {
    const dropdown = document.getElementById('relatedBusiness');
    if (dropdown) {
        dropdown.innerHTML = '<option value="">General Expense</option>';
        
        investments.forEach(investment => {
            const option = document.createElement('option');
            option.value = investment.id;
            option.textContent = investment.name;
            dropdown.appendChild(option);
        });
    }
}

function getWeekOfMonth(date) {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const dayOfMonth = date.getDate();
    const dayOfWeek = firstDay.getDay();
    return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('sw-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('TZS', 'TSh');
}

// Helper function to format numbers with comma separators
function formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(number);
}

// Helper function to format input fields with comma separators
function formatNumberInput(input) {
    let value = input.value.replace(/,/g, '').trim(); // Remove existing commas and whitespace
    if (value && !isNaN(value) && value !== '') {
        const numValue = parseFloat(value);
        // Only add decimals if the original input had decimals
        const hasDecimals = value.includes('.');
        input.value = hasDecimals ? formatNumber(numValue, 2) : formatNumber(numValue, 0);
    }
}

// Helper function to remove commas from input for processing
function getNumericValue(input) {
    const value = input.value.replace(/,/g, '').trim();
    return value && !isNaN(value) ? parseFloat(value) : 0;
}

// Add input formatting to number fields (simplified approach)
function addInputFormatting() {
    const numberInputs = [
        'investmentAmount', 'dailyRevenue', 'expenseAmount', 'initialBalance',
        'depositAmount', 'withdrawalAmount', 'revenueAmount'
    ];
    
    numberInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            // Only format on input event with debouncing to avoid conflicts
            let timeout;
            input.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const value = input.value.replace(/,/g, '').trim();
                    if (value && !isNaN(value) && value !== '' && document.activeElement === input) {
                        const numValue = parseFloat(value);
                        const hasDecimals = value.includes('.');
                        const formatted = hasDecimals ? formatNumber(numValue, 2) : formatNumber(numValue, 0);
                        
                        // Only update if different to avoid cursor jumping
                        if (input.value !== formatted) {
                            const cursorPos = input.selectionStart;
                            input.value = formatted;
                            // Try to maintain cursor position
                            const newPos = Math.min(cursorPos + (formatted.length - value.length), formatted.length);
                            input.setSelectionRange(newPos, newPos);
                        }
                    }
                }, 500); // 500ms delay
            });
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Data is now automatically saved via API calls
// This function is kept for backward compatibility but does nothing
function saveData() {
    // Data is automatically saved when making API calls
    // No need to manually save to localStorage anymore
}

// Account Management Functions
function setupAccountEventListeners() {
    // Account form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const editAccountId = document.getElementById('editAccountId').value;
            if (editAccountId) {
                updateAccount(editAccountId);
            } else {
                addAccount();
            }
        });
    }
    
    // Deposit form
    const depositForm = document.getElementById('depositForm');
    if (depositForm) {
        depositForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addDeposit();
        });
    }
    
    // Withdrawal form
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addWithdrawal();
        });
    }
    
    // Account filters
    const accountFilter = document.getElementById('accountFilter');
    if (accountFilter) {
        accountFilter.addEventListener('change', updateTransactionsDisplay);
    }
    
    const transactionTypeFilter = document.getElementById('transactionTypeFilter');
    if (transactionTypeFilter) {
        transactionTypeFilter.addEventListener('change', updateTransactionsDisplay);
    }
}

function showAddAccount() {
    // Reset form for adding new account
    document.getElementById('accountForm').reset();
    document.getElementById('editAccountId').value = '';
    document.getElementById('accountModalTitle').textContent = 'Add Bank Account';
    document.getElementById('accountSubmitBtn').textContent = 'Add Account';
    
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showEditAccount(accountId) {
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        alert('Account not found');
        return;
    }
    
    // Pre-fill form with account data
    document.getElementById('editAccountId').value = account.id;
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountType').value = account.type;
    document.getElementById('bankName').value = account.bank_name;
    document.getElementById('initialBalance').value = account.initial_balance;
    document.getElementById('accountNotes').value = account.notes || '';
    
    // Update modal title and button text
    document.getElementById('accountModalTitle').textContent = 'Edit Bank Account';
    document.getElementById('accountSubmitBtn').textContent = 'Update Account';
    
    const modal = document.getElementById('accountModal');
    if (modal) {
        modal.classList.add('show');
    }
}

function showAddDeposit() {
    document.getElementById('depositModal').classList.add('show');
}

function showAddWithdrawal() {
    document.getElementById('withdrawalModal').classList.add('show');
}

async function addAccount() {
    const accountName = document.getElementById('accountName').value.trim();
    const accountType = document.getElementById('accountType').value;
    const bankName = document.getElementById('bankName').value.trim();
    const initialBalance = getNumericValue(document.getElementById('initialBalance'));
    
    // Validate required fields
    if (!accountName) {
        alert('Please enter an account name');
        return;
    }
    
    if (!accountType) {
        alert('Please select an account type');
        return;
    }
    
    if (!bankName) {
        alert('Please enter a bank name');
        return;
    }
    
    try {
        showLoadingState(true);
        
        const accountData = {
            name: accountName,
            type: accountType,
            bank_name: bankName,
            initial_balance: initialBalance
        };
        
        const newAccount = await apiService.createAccount(accountData);
        
        // Update local data
        accounts.push(newAccount);
        
        // Refresh transaction data if there was an initial balance
        if (initialBalance > 0) {
            const updatedTransactions = await apiService.getTransactions();
            transactions.length = 0;
            transactions.push(...(updatedTransactions.transactions || updatedTransactions));
            updateTransactionsDisplay();
        }
        
        // Update displays
        updateAccountsDisplay();
        populateAccountDropdowns();
        
        // Close modal and reset form
        closeModal('accountModal');
        document.getElementById('accountForm').reset();
        
        apiService.showSuccessMessage('Account added successfully!');
        
    } catch (error) {
        console.error('Error adding account:', error);
        apiService.handleError(error, 'Adding account');
    } finally {
        showLoadingState(false);
    }
}

async function updateAccount(accountId) {
    const accountName = document.getElementById('accountName').value.trim();
    const accountType = document.getElementById('accountType').value;
    const bankName = document.getElementById('bankName').value.trim();
    const initialBalance = getNumericValue(document.getElementById('initialBalance'));
    const notes = document.getElementById('accountNotes').value.trim();
    
    // Validate required fields
    if (!accountName) {
        alert('Please enter an account name');
        return;
    }
    
    if (!accountType) {
        alert('Please select an account type');
        return;
    }
    
    if (!bankName) {
        alert('Please enter a bank name');
        return;
    }
    
    try {
        showLoadingState(true);
        
        const accountData = {
            name: accountName,
            type: accountType,
            bank_name: bankName,
            initial_balance: initialBalance,
            notes: notes
        };
        
        const updatedAccount = await apiService.updateAccount(accountId, accountData);
        
        // Update local data
        const accountIndex = accounts.findIndex(acc => acc.id === accountId);
        if (accountIndex !== -1) {
            accounts[accountIndex] = updatedAccount;
        }
        
        // Refresh displays
        updateAccountsDisplay();
        populateAccountDropdowns();
        
        // Close modal and reset form
        closeModal('accountModal');
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
    if (!confirm('Are you sure you want to delete this account? This action cannot be undone and will also delete all associated transactions.')) {
        return;
    }

    try {
        showLoadingState(true);
        
        const response = await fetch(`/api/accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete account');
        }

        // Remove from local array
        const index = accounts.findIndex(acc => acc.id === accountId);
        if (index !== -1) {
            accounts.splice(index, 1);
        }

        // Update UI
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

async function addDeposit() {
    const accountId = document.getElementById('depositAccount').value;
    const amount = getNumericValue(document.getElementById('depositAmount'));
    const description = document.getElementById('depositDescription').value;
    
    if (!accountId || !amount || amount <= 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.deposit(accountId, {
            amount: amount,
            description: description || 'Deposit'
        });
        
        // Refresh account and transaction data
        const updatedAccounts = await apiService.getAccounts();
        accounts.length = 0;
        accounts.push(...updatedAccounts);
        
        const updatedTransactions = await apiService.getTransactions();
        transactions.length = 0;
        transactions.push(...(updatedTransactions.transactions || updatedTransactions));
        
        // Update displays
        updateAccountsDisplay();
        updateTransactionsDisplay();
        
        // Close modal and reset form
        closeModal('depositModal');
        document.getElementById('depositForm').reset();
        
        apiService.showSuccessMessage('Deposit added successfully!');
        
    } catch (error) {
        console.error('Error adding deposit:', error);
        apiService.handleError(error, 'Adding deposit');
    } finally {
        showLoadingState(false);
    }
}

async function addWithdrawal() {
    const accountId = document.getElementById('withdrawalAccount').value;
    const amount = getNumericValue(document.getElementById('withdrawalAmount'));
    const description = document.getElementById('withdrawalDescription').value;
    
    if (!accountId || !amount || amount <= 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    try {
        showLoadingState(true);
        
        await apiService.withdraw(accountId, {
            amount: amount,
            description: description || 'Withdrawal'
        });
        
        // Refresh account and transaction data
        const updatedAccounts = await apiService.getAccounts();
        accounts.length = 0;
        accounts.push(...updatedAccounts);
        
        const updatedTransactions = await apiService.getTransactions();
        transactions.length = 0;
        transactions.push(...(updatedTransactions.transactions || updatedTransactions));
        
        // Update displays
        updateAccountsDisplay();
        updateTransactionsDisplay();
        
        // Close modal and reset form
        closeModal('withdrawalModal');
        document.getElementById('withdrawalForm').reset();
        
        apiService.showSuccessMessage('Withdrawal completed successfully!');
        
    } catch (error) {
        console.error('Error processing withdrawal:', error);
        apiService.handleError(error, 'Processing withdrawal');
    } finally {
        showLoadingState(false);
    }
}

function updateAccountsDisplay() {
    const container = document.getElementById('accountsList');
    if (!container) return;
    
    if (accounts.length === 0) {
        container.innerHTML = '<div class="empty-state">No accounts yet. Add your first account to get started!</div>';
        return;
    }
    
    container.innerHTML = accounts.map(account => {
        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const totalDeposits = accountTransactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = accountTransactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);
        
        return `
            <div class="account-item">
                <div class="account-header">
                    <span class="account-name">${account.name}</span>
                    <span class="account-type">${account.type}</span>
                </div>
                <div class="account-bank">
                    <span class="bank-label">Bank:</span>
                    <span class="bank-name">${account.bankName || 'N/A'}</span>
                </div>
                <div class="account-balance">
                    <span class="balance-label">Balance:</span>
                    <span class="balance-amount">${formatCurrency(account.balance)}</span>
                </div>
                <div class="account-stats">
                    <div class="stat-item">
                        <span class="stat-label">Total Deposits:</span>
                        <span class="stat-value">${formatCurrency(totalDeposits)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Withdrawals:</span>
                        <span class="stat-value">${formatCurrency(totalWithdrawals)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Transactions:</span>
                        <span class="stat-value">${accountTransactions.length}</span>
                    </div>
                </div>
                <div class="account-actions">
                    <button class="action-btn" data-action="deposit" data-account-id="${account.id}">Deposit</button>
                    <button class="action-btn" data-action="withdraw" data-account-id="${account.id}">Withdraw</button>
                    <button class="action-btn edit-btn" data-action="edit" data-account-id="${account.id}">Edit</button>
                    <button class="action-btn delete-btn" data-action="delete-account" data-account-id="${account.id}">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Filter transactions based on dropdown selections
function filterTransactions() {
    updateTransactionsDisplay();
}

function updateTransactionsDisplay() {
    const container = document.getElementById('transactionsList');
    if (!container) return;
    
    const accountFilter = document.getElementById('accountFilter')?.value || 'all';
    const typeFilter = document.getElementById('transactionTypeFilter')?.value || 'all';
    
    let filteredTransactions = transactions;
    
    // Filter by account
    if (accountFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.accountId === accountFilter);
    }
    
    // Filter by type
    if (typeFilter !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === typeFilter);
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredTransactions.length === 0) {
        container.innerHTML = '<div class="empty-state">No transactions found for the selected filters.</div>';
        return;
    }
    
    container.innerHTML = filteredTransactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        const accountName = account ? account.name : 'Unknown Account';
        
        return `
            <div class="transaction-item">
                <div class="transaction-header">
                    <span class="transaction-type ${transaction.type}">${transaction.type.toUpperCase()}</span>
                    <span class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount)}
                    </span>
                </div>
                <div class="transaction-details">
                    <span class="transaction-account">${accountName}</span>
                    <span class="transaction-description">${transaction.description}</span>
                    <span class="transaction-date">${formatDate(transaction.date)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function populateAccountDropdowns() {
    const dropdowns = [
        'depositAccount',
        'withdrawalAccount',
        'accountFilter',
        'expenseAccount',
        'investmentAccount',
        'revenueAccount'
    ];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;
        
        // Save current value
        const currentValue = dropdown.value;
        
        // Clear existing options
        dropdown.innerHTML = '';
        
        // Add default option for filters
        if (dropdownId === 'accountFilter') {
            dropdown.innerHTML = '<option value="all">All Accounts</option>';
        } else {
            dropdown.innerHTML = '<option value="">Select Account</option>';
        }
        
        // Add account options
        accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.name} (${formatCurrency(account.balance)})`;
            dropdown.appendChild(option);
        });
        
        // Restore previous value if it still exists
        if (currentValue && [...dropdown.options].some(opt => opt.value === currentValue)) {
            dropdown.value = currentValue;
        }
    });
}

// Event Listeners
document.getElementById('expenseFilter').addEventListener('change', renderExpenses);

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// Sample data for demonstration (remove in production)
function loadSampleData() {
    if (investments.length === 0) {
        const sampleInvestments = [
            {
                id: '1',
                name: 'City Taxi Service',
                amount: 20000000,
                type: 'taxi',
                description: 'Fleet of 5 taxis operating in the city center',
                dateCreated: new Date().toISOString(),
                totalReturns: 2500000,
                dailyRevenues: [
                    { date: '2024-01-15', amount: 85000 },
                    { date: '2024-01-16', amount: 92000 },
                    { date: '2024-01-17', amount: 78000 }
                ]
            },
            {
                id: '2',
                name: 'Corner Grocery Store',
                amount: 20000000,
                type: 'shop',
                description: 'Small grocery store in residential area',
                dateCreated: new Date().toISOString(),
                totalReturns: 1800000,
                dailyRevenues: [
                    { date: '2024-01-15', amount: 65000 },
                    { date: '2024-01-16', amount: 72000 },
                    { date: '2024-01-17', amount: 58000 }
                ]
            }
        ];
        
        investments = sampleInvestments;
        saveData();
        updateDashboard();
        renderInvestments();
        populateBusinessDropdown();
    }
}

// Recent transactions display function
function updateRecentTransactions() {
    const recentTransactionsElement = document.getElementById('recentTransactions');
    if (!recentTransactionsElement) return;
    
    // Get last 5 transactions
    const recentTransactions = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentTransactions.length === 0) {
        recentTransactionsElement.innerHTML = '<div class="empty-state">No recent transactions</div>';
        return;
    }
    
    recentTransactionsElement.innerHTML = recentTransactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        const accountName = account ? account.name : 'Unknown Account';
        
        return `
            <div class="recent-transaction-item">
                <div class="transaction-info">
                    <span class="transaction-type ${transaction.type}">${transaction.type.toUpperCase()}</span>
                    <span class="transaction-description">${transaction.description}</span>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'deposit' ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `;
    }).join('');
}

// Dashboard Performance Summary
function updateDashboardPerformance() {
    const container = document.getElementById('dashboardPerformanceList');
    if (!container) return;
    
    if (investments.length === 0) {
        container.innerHTML = '<div class="empty-state-small">No investments yet</div>';
        return;
    }
    
    // Get performance data and sort by ROI
    const performanceData = calculateBusinessPerformance();
    const topPerformers = performanceData
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5);
    
    container.innerHTML = topPerformers.map((perf, index) => {
        const investment = investments.find(inv => inv.id === perf.investmentId);
        if (!investment) return '';
        
        return `
            <div class="dashboard-performance-item">
                <div class="performance-rank">${index + 1}</div>
                <div class="performance-info">
                    <div class="business-name">${investment.businessName}</div>
                    <div class="business-metrics">
                        <span class="roi-metric ${perf.roi >= 0 ? 'positive' : 'negative'}">
                            ROI: ${formatNumber(perf.roi, 1)}%
                        </span>
                        <span class="profit-metric ${perf.profit >= 0 ? 'positive' : 'negative'}">
                            ${formatCurrency(perf.profit)}
                        </span>
                    </div>
                </div>
                <div class="performance-status">
                    ${perf.isBreakEven ? 
                        '<span class="status-badge break-even">✓</span>' : 
                        '<span class="status-badge pending">⏳</span>'
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Update Performance Table on Dashboard
function updatePerformanceTable() {
    const tableBody = document.getElementById('performanceTableBody');
    if (!tableBody) return;

    if (investments.length === 0) {
        tableBody.innerHTML = '<div class="performance-table-empty">No investments yet</div>';
        return;
    }

    // Calculate performance for each investment
    const performanceData = investments.map(investment => {
        const totalRevenue = investment.totalReturns || 0;
        const roi = investment.amount > 0 ? ((totalRevenue - investment.amount) / investment.amount * 100) : 0;
        const dailyAvg = calculateDailyAverage(investment);
        const breakEvenMonths = calculateBreakEvenMonths(investment);
        
        return {
            name: investment.name,
            roi: roi,
            returns: totalRevenue,
            breakEvenMonths: breakEvenMonths,
            totalRevenue: totalRevenue
        };
    });

    // Sort by ROI and take top 5
    const topPerformers = performanceData
        .sort((a, b) => b.roi - a.roi)
        .slice(0, 5);

    tableBody.innerHTML = topPerformers.map(business => {
        const returnsClass = business.returns >= 0 ? 'positive' : 'negative';
        const breakEvenText = business.breakEvenMonths > 0 ? 
            `${business.breakEvenMonths}mo` : 
            (business.roi >= 0 ? 'Achieved' : 'Pending');
        
        return `
            <div class="performance-table-row">
                <div class="performance-table-business" title="${business.name}">${business.name}</div>
                <div class="performance-table-roi ${returnsClass}">${formatCurrency(business.returns)}</div>
                <div class="performance-table-breakeven">${breakEvenText}</div>
            </div>
        `;
    }).join('');
}

// Uncomment the line below to load sample data for testing
// loadSampleData();