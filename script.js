// Data Storage
let investments = JSON.parse(localStorage.getItem('investments')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let dailyRevenues = JSON.parse(localStorage.getItem('dailyRevenues')) || {};
let accounts = JSON.parse(localStorage.getItem('accounts')) || [];
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// Chart instances
let financialChart = null;
let breakEvenChart = null;

// Initialize charts
function initializeCharts() {
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
    const breakEvenAmount = totalInvestment + totalExpenses;
    const progress = breakEvenAmount > 0 ? Math.min((totalRevenue / breakEvenAmount) * 100, 100) : 0;
    
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
            } else if (totalRevenue > 0 && breakEvenAmount > totalRevenue) {
                // Calculate average daily revenue
                const totalDays = investments.reduce((days, inv) => {
                    const startDate = new Date(inv.date);
                    const currentDate = new Date();
                    return Math.max(days, Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24)));
                }, 1);
                
                const dailyAverage = totalRevenue / totalDays;
                const remainingAmount = breakEvenAmount - totalRevenue;
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
document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    updateDashboard();
    renderInvestments();
    renderExpenses();
    renderAnalytics();
    populateBusinessDropdown();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    populateAccountDropdowns();
    
    // Initialize charts after DOM is loaded
    setTimeout(() => {
        initializeCharts();
        updateCharts();
    }, 100);
    
    // Set up account management event listeners
    setupAccountEventListeners();
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
    return investments.reduce((total, investment) => {
        return total + investment.amount + (investment.totalReturns || 0);
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
    const totalInvested = investments.reduce((total, inv) => total + inv.amount, 0);
    const totalReturns = investments.reduce((total, inv) => total + (inv.totalReturns || 0), 0);
    
    if (totalInvested === 0) return 0;
    return ((totalReturns / totalInvested) * 100).toFixed(1);
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
    // Current account balances represent remaining balance
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
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
            const changePercent = ((remainingBalance - startingBalance) / startingBalance * 100).toFixed(1);
            remainingTrendElement.textContent = changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`;
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
        // Get previous revenue from localStorage for comparison
        const previousRevenue = parseFloat(localStorage.getItem('previousRevenue')) || 0;
        
        if (previousRevenue > 0) {
            const changePercent = ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
            
            if (changePercent > 0) {
                revenueTrendElement.textContent = `+${changePercent}%`;
                revenueTrendElement.className = 'stat-trend up';
            } else if (changePercent < 0) {
                revenueTrendElement.textContent = `${changePercent}%`;
                revenueTrendElement.className = 'stat-trend down';
            } else {
                revenueTrendElement.textContent = '0%';
                revenueTrendElement.className = 'stat-trend';
            }
        } else {
            revenueTrendElement.textContent = '--';
            revenueTrendElement.className = 'stat-trend';
        }
        
        // Store current revenue as previous for next comparison
        localStorage.setItem('previousRevenue', totalRevenue.toString());
    }
}

// Investment Management
function showAddInvestment() {
    document.getElementById('investmentModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Investment Form Handler
document.getElementById('investmentForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const accountId = document.getElementById('investmentAccount').value;
    
    // Check if account is selected and has sufficient funds
    if (accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) {
            alert('Selected account not found.');
            return;
        }
        if (account.balance < amount) {
            alert(`Insufficient funds in ${account.name}. Available: ${formatCurrency(account.balance)}`);
            return;
        }
        
        // Deduct from account
        account.balance -= amount;
        
        // Add transaction record
        const transaction = {
            id: Date.now().toString() + '_investment',
            accountId: accountId,
            type: 'investment',
            amount: amount,
            description: `Investment in ${document.getElementById('businessName').value}: ${document.getElementById('investmentNotes').value || 'Investment'}`,
            date: new Date().toISOString(),
            relatedId: Date.now().toString()
        };
        transactions.push(transaction);
    }
    
    const investment = {
        id: Date.now().toString(),
        name: document.getElementById('businessName').value,
        amount: amount,
        type: document.getElementById('businessType').value,
        description: document.getElementById('investmentNotes').value,
        dateCreated: document.getElementById('startDate').value || new Date().toISOString(),
        expectedDailyRevenue: parseFloat(document.getElementById('dailyRevenue').value) || 0,
        totalReturns: 0,
        dailyRevenues: [],
        expenses: [],
        accountId: accountId || null
    };
    
    investments.push(investment);
    saveData();
    renderInvestments();
    updateDashboard();
    populateBusinessDropdown();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    closeModal('investmentModal');
    
    // Reset form
    document.getElementById('investmentForm').reset();
});

function renderInvestments() {
    const container = document.getElementById('investmentsList');
    
    if (investments.length === 0) {
        container.innerHTML = '<div class="empty-state">No investments yet. Add your first investment to get started!</div>';
        return;
    }
    
    container.innerHTML = investments.map(investment => {
        const roi = investment.amount > 0 ? ((investment.totalReturns / investment.amount) * 100).toFixed(1) : 0;
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
                    <button class="action-btn" onclick="addRevenue('${investment.id}')">Add Revenue</button>
                    <button class="action-btn" onclick="viewDetails('${investment.id}')">View Details</button>
                </div>
            </div>
        `;
    }).join('');
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
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalReturns = investments.reduce((sum, inv) => sum + (inv.totalReturns || 0), 0);
    return totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(2) : '0.00';
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
                            <span class="metric-value ${roiClass}">${perf.roi}%</span>
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
                        <div class="progress-label">Break-even Progress: ${perf.breakEvenProgress.toFixed(1)}%</div>
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
    if (dailyAvg <= 0) return '∞';
    
    const monthlyAvg = dailyAvg * 30;
    const remainingAmount = investment.amount - investment.totalReturns;
    
    if (remainingAmount <= 0) return 'Achieved';
    
    return Math.ceil(remainingAmount / monthlyAvg);
}

function addRevenue(investmentId) {
    const amount = prompt('Enter revenue amount for today:');
    const accountId = prompt('Enter account ID to deposit to (leave empty to skip):');
    
    if (amount && !isNaN(amount)) {
        const investment = investments.find(inv => inv.id === investmentId);
        if (investment) {
            // Add to account if specified
            if (accountId) {
                const account = accounts.find(acc => acc.id === accountId);
                if (account) {
                    account.balance += parseFloat(amount);
                    
                    // Add transaction record
                    const transaction = {
                        id: Date.now().toString() + '_revenue',
                        accountId: accountId,
                        type: 'deposit',
                        amount: parseFloat(amount),
                        description: `Revenue from ${investment.name}`,
                        date: new Date().toISOString()
                    };
                    transactions.push(transaction);
                }
            }
            
            const revenue = {
                date: new Date().toISOString().split('T')[0],
                amount: parseFloat(amount),
                accountId: accountId || null
            };
            
            investment.dailyRevenues = investment.dailyRevenues || [];
            investment.dailyRevenues.push(revenue);
            investment.totalReturns = (investment.totalReturns || 0) + parseFloat(amount);
            
            saveData();
            renderInvestments();
            updateDashboard();
            updateAccountsDisplay();
            updateTransactionsDisplay();
        }
    }
}

// Expense Management
function showAddExpense() {
    document.getElementById('expenseModal').style.display = 'block';
    populateBusinessDropdown();
    populateAccountDropdowns();
}

document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const accountId = document.getElementById('expenseAccount').value;
    
    // Check if account is selected and has sufficient funds
    if (accountId) {
        const account = accounts.find(acc => acc.id === accountId);
        if (!account) {
            alert('Selected account not found.');
            return;
        }
        if (account.balance < amount) {
            alert(`Insufficient funds in ${account.name}. Available: ${formatCurrency(account.balance)}`);
            return;
        }
        
        // Deduct from account
        account.balance -= amount;
        
        // Add transaction record
        const transaction = {
            id: Date.now().toString() + '_expense',
            accountId: accountId,
            type: 'expense',
            amount: amount,
            description: `${document.getElementById('expenseCategory').value}: ${document.getElementById('expenseDescription').value || 'Expense'}`,
            date: new Date().toISOString(),
            relatedId: Date.now().toString()
        };
        transactions.push(transaction);
    }
    
    const expense = {
        id: Date.now().toString(),
        description: document.getElementById('expenseDescription').value,
        amount: amount,
        category: document.getElementById('expenseCategory').value,
        relatedBusiness: document.getElementById('relatedBusiness').value,
        date: new Date().toISOString(),
        week: getWeekOfMonth(new Date()),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        accountId: accountId || null
    };
    
    expenses.push(expense);
    saveData();
    renderExpenses();
    updateDashboard();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    closeModal('expenseModal');
    
    // Reset form
    document.getElementById('expenseForm').reset();
});

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
                    <p><strong>Progress:</strong> ${data.progressPercent.toFixed(1)}%</p>
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

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function saveData() {
    localStorage.setItem('investments', JSON.stringify(investments));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('accounts', JSON.stringify(accounts));
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Account Management Functions
function setupAccountEventListeners() {
    // Account form
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAccount();
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
    document.getElementById('accountModal').style.display = 'block';
}

function showAddDeposit() {
    document.getElementById('depositModal').style.display = 'block';
}

function showAddWithdrawal() {
    document.getElementById('withdrawalModal').style.display = 'block';
}

function addAccount() {
    const accountName = document.getElementById('accountName').value.trim();
    const accountType = document.getElementById('accountType').value;
    const bankName = document.getElementById('bankName').value.trim();
    const initialBalance = parseFloat(document.getElementById('initialBalance').value) || 0;
    
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
    
    const account = {
        id: Date.now().toString(),
        name: accountName,
        type: accountType,
        bankName: bankName,
        balance: initialBalance,
        dateCreated: new Date().toISOString()
    };
    
    accounts.push(account);
    
    // Add initial balance transaction if > 0
    if (initialBalance > 0) {
        const transaction = {
            id: Date.now().toString() + '_initial',
            accountId: account.id,
            type: 'deposit',
            amount: initialBalance,
            description: 'Initial balance',
            date: new Date().toISOString()
        };
        transactions.push(transaction);
    }
    
    saveData();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    populateAccountDropdowns();
    closeModal('accountModal');
    
    // Reset form
    document.getElementById('accountForm').reset();
}

function addDeposit() {
    const accountId = document.getElementById('depositAccount').value;
    const amount = parseFloat(document.getElementById('depositAmount').value);
    const description = document.getElementById('depositDescription').value;
    
    if (!accountId || !amount || amount <= 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        alert('Account not found.');
        return;
    }
    
    // Update account balance
    account.balance += amount;
    
    // Add transaction
    const transaction = {
        id: Date.now().toString(),
        accountId: accountId,
        type: 'deposit',
        amount: amount,
        description: description || 'Deposit',
        date: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveData();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    closeModal('depositModal');
    
    // Reset form
    document.getElementById('depositForm').reset();
}

function addWithdrawal() {
    const accountId = document.getElementById('withdrawalAccount').value;
    const amount = parseFloat(document.getElementById('withdrawalAmount').value);
    const description = document.getElementById('withdrawalDescription').value;
    
    if (!accountId || !amount || amount <= 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
        alert('Account not found.');
        return;
    }
    
    if (account.balance < amount) {
        alert('Insufficient funds in this account.');
        return;
    }
    
    // Update account balance
    account.balance -= amount;
    
    // Add transaction
    const transaction = {
        id: Date.now().toString(),
        accountId: accountId,
        type: 'withdrawal',
        amount: amount,
        description: description || 'Withdrawal',
        date: new Date().toISOString()
    };
    
    transactions.push(transaction);
    saveData();
    updateAccountsDisplay();
    updateTransactionsDisplay();
    closeModal('withdrawalModal');
    
    // Reset form
    document.getElementById('withdrawalForm').reset();
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
                    <button class="action-btn" onclick="showAddDeposit(); document.getElementById('depositAccount').value='${account.id}'">Deposit</button>
                    <button class="action-btn" onclick="showAddWithdrawal(); document.getElementById('withdrawalAccount').value='${account.id}'">Withdraw</button>
                </div>
            </div>
        `;
    }).join('');
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
            modal.style.display = 'none';
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
                            ROI: ${perf.roi.toFixed(1)}%
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