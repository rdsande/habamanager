// API Service Module for Haba Manager
class ApiService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.cache = {
            investments: null,
            expenses: null,
            accounts: null,
            transactions: null
        };
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Investment API methods
    async getInvestments() {
        if (this.cache.investments) {
            return this.cache.investments;
        }
        const investments = await this.request('/investments');
        this.cache.investments = investments;
        return investments;
    }

    async getInvestment(id) {
        return await this.request(`/investments/${id}`);
    }

    async createInvestment(investmentData) {
        const investment = await this.request('/investments', {
            method: 'POST',
            body: JSON.stringify(investmentData)
        });
        this.invalidateCache('investments');
        return investment;
    }

    async updateInvestment(id, investmentData) {
        const investment = await this.request(`/investments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(investmentData)
        });
        this.invalidateCache('investments');
        return investment;
    }

    async deleteInvestment(id) {
        await this.request(`/investments/${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache('investments');
    }

    async addDailyRevenue(investmentId, revenueData) {
        const result = await this.request(`/investments/${investmentId}/revenue`, {
            method: 'POST',
            body: JSON.stringify(revenueData)
        });
        this.invalidateCache(['investments', 'accounts', 'transactions']);
        return result;
    }

    async updateDailyRevenue(revenueId, revenueData) {
        const result = await this.request(`/daily-revenues/${revenueId}`, {
            method: 'PUT',
            body: JSON.stringify(revenueData)
        });
        this.invalidateCache(['investments', 'accounts', 'transactions']);
        return result;
    }

    async getInvestmentPerformance(id) {
        return await this.request(`/investments/${id}/performance`);
    }

    // Expense API methods
    async getExpenses(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/expenses?${queryParams}` : '/expenses';
        const expenses = await this.request(endpoint);
        if (!filters || Object.keys(filters).length === 0) {
            this.cache.expenses = expenses;
        }
        return expenses;
    }

    async getExpense(id) {
        return await this.request(`/expenses/${id}`);
    }

    async createExpense(expenseData) {
        const expense = await this.request('/expenses', {
            method: 'POST',
            body: JSON.stringify(expenseData)
        });
        this.invalidateCache(['expenses', 'accounts', 'transactions']);
        return expense;
    }

    async updateExpense(id, expenseData) {
        const expense = await this.request(`/expenses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(expenseData)
        });
        this.invalidateCache(['expenses', 'accounts', 'transactions']);
        return expense;
    }

    async deleteExpense(id) {
        await this.request(`/expenses/${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache(['expenses', 'accounts', 'transactions']);
    }

    async getExpenseSummary(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/expenses/summary/category?${queryParams}` : '/expenses/summary/category';
        return await this.request(endpoint);
    }

    async getExpenseTrends(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/expenses/trends/monthly?${queryParams}` : '/expenses/trends/monthly';
        return await this.request(endpoint);
    }

    // Account API methods
    async getAccounts() {
        if (this.cache.accounts) {
            return this.cache.accounts;
        }
        const accounts = await this.request('/accounts');
        this.cache.accounts = accounts;
        return accounts;
    }

    async getAccount(id) {
        return await this.request(`/accounts/${id}`);
    }

    async createAccount(accountData) {
        const account = await this.request('/accounts', {
            method: 'POST',
            body: JSON.stringify(accountData)
        });
        this.invalidateCache('accounts');
        return account;
    }

    async updateAccount(id, accountData) {
        const account = await this.request(`/accounts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(accountData)
        });
        this.invalidateCache('accounts');
        return account;
    }

    async deleteAccount(id) {
        await this.request(`/accounts/${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache(['accounts', 'transactions']);
    }

    async makeDeposit(accountId, depositData) {
        const result = await this.request(`/accounts/${accountId}/deposit`, {
            method: 'POST',
            body: JSON.stringify(depositData)
        });
        this.invalidateCache(['accounts', 'transactions']);
        return result;
    }

    async makeWithdrawal(accountId, withdrawalData) {
        const result = await this.request(`/accounts/${accountId}/withdraw`, {
            method: 'POST',
            body: JSON.stringify(withdrawalData)
        });
        this.invalidateCache(['accounts', 'transactions']);
        return result;
    }

    async getAccountBalance(id) {
        return await this.request(`/accounts/${id}/balance`);
    }

    // Transaction API methods
    async getTransactions(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/transactions?${queryParams}` : '/transactions';
        const result = await this.request(endpoint);
        if (!filters || Object.keys(filters).length === 0) {
            this.cache.transactions = result.transactions || result;
        }
        return result;
    }

    async getTransaction(id) {
        return await this.request(`/transactions/${id}`);
    }

    async getAccountTransactions(accountId, filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/transactions/account/${accountId}?${queryParams}` : `/transactions/account/${accountId}`;
        return await this.request(endpoint);
    }

    async createTransaction(transactionData) {
        const transaction = await this.request('/transactions', {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        this.invalidateCache(['transactions', 'accounts']);
        return transaction;
    }

    async updateTransaction(id, transactionData) {
        const transaction = await this.request(`/transactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(transactionData)
        });
        this.invalidateCache('transactions');
        return transaction;
    }

    async deleteTransaction(id) {
        await this.request(`/transactions/${id}`, {
            method: 'DELETE'
        });
        this.invalidateCache(['transactions', 'accounts']);
    }

    async bulkDeleteTransactions() {
        const result = await this.request('/transactions/bulk', {
            method: 'DELETE'
        });
        this.invalidateCache(['transactions', 'accounts']);
        return result;
    }

    async deleteAccount(accountId) {
        const response = await fetch(`${this.baseURL}/accounts/${accountId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete account');
        }
        
        return await response.json();
    }

    async getAuditLogs(params = {}) {
        const queryParams = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/audit-logs?${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch audit logs');
        }
        
        return await response.json();
    }

    async getTransactionSummary(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/transactions/summary/type?${queryParams}` : '/transactions/summary/type';
        return await this.request(endpoint);
    }

    async getTransactionTrends(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/transactions/trends/daily?${queryParams}` : '/transactions/trends/daily';
        return await this.request(endpoint);
    }

    // Analytics API methods
    async getDashboardData(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/dashboard?${queryParams}` : '/analytics/dashboard';
        return await this.request(endpoint);
    }

    async getRevenueTrends(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/revenue-trends?${queryParams}` : '/analytics/revenue-trends';
        return await this.request(endpoint);
    }

    async getInvestmentPerformanceAll(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/investment-performance?${queryParams}` : '/analytics/investment-performance';
        return await this.request(endpoint);
    }

    async getBalanceTrends(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/balance-trends?${queryParams}` : '/analytics/balance-trends';
        return await this.request(endpoint);
    }

    async getProfitLoss(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/profit-loss?${queryParams}` : '/analytics/profit-loss';
        return await this.request(endpoint);
    }

    async getBusinessComparison(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/analytics/business-comparison?${queryParams}` : '/analytics/business-comparison';
        return await this.request(endpoint);
    }

    // Cache management
    invalidateCache(keys) {
        if (Array.isArray(keys)) {
            keys.forEach(key => {
                this.cache[key] = null;
            });
        } else {
            this.cache[keys] = null;
        }
    }

    clearCache() {
        Object.keys(this.cache).forEach(key => {
            this.cache[key] = null;
        });
    }

    // Health check
    async healthCheck() {
        return await this.request('/health');
    }

    // Utility methods for backward compatibility
    async loadAllData() {
        try {
            const [investments, expenses, accounts, transactions] = await Promise.all([
                this.getInvestments(),
                this.getExpenses(),
                this.getAccounts(),
                this.getTransactions()
            ]);

            return {
                investments,
                expenses,
                accounts,
                transactions: transactions.transactions || transactions
            };
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    // Error handling helper
    handleError(error, context = '') {
        console.error(`API Error${context ? ` (${context})` : ''}:`, error);
        
        // Show user-friendly error message
        const errorMessage = error.message || 'An unexpected error occurred';
        this.showErrorMessage(errorMessage);
        
        return null;
    }

    showErrorMessage(message) {
        // Create or update error display
        let errorDiv = document.getElementById('api-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'api-error-message';
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 400px;
                font-size: 14px;
            `;
            document.body.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        }, 5000);
    }

    showSuccessMessage(message) {
        // Create or update success display
        let successDiv = document.getElementById('api-success-message');
        if (!successDiv) {
            successDiv = document.createElement('div');
            successDiv.id = 'api-success-message';
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #d1fae5;
                border: 1px solid #a7f3d0;
                color: #065f46;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                max-width: 400px;
                font-size: 14px;
            `;
            document.body.appendChild(successDiv);
        }
        
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successDiv) {
                successDiv.style.display = 'none';
            }
        }, 3000);
    }
}

// Create global API service instance
const apiService = new ApiService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}