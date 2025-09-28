// API Service for Laravel Backend Communication
class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    // Generic request handler
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.headers,
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    // Investment API methods
    async getInvestments() {
        return this.get('/investments');
    }

    async createInvestment(data) {
        return this.post('/investments', data);
    }

    async updateInvestment(id, data) {
        return this.put(`/investments/${id}`, data);
    }

    async deleteInvestment(id) {
        return this.delete(`/investments/${id}`);
    }

    async getInvestment(id) {
        return this.get(`/investments/${id}`);
    }

    // Investment Returns API methods
    async getInvestmentReturns(investmentId = null) {
        const endpoint = investmentId ? `/investment-returns?investment_id=${investmentId}` : '/investment-returns';
        return this.get(endpoint);
    }

    async createInvestmentReturn(data) {
        return this.post('/investment-returns', data);
    }

    async updateInvestmentReturn(id, data) {
        return this.put(`/investment-returns/${id}`, data);
    }

    async deleteInvestmentReturn(id) {
        return this.delete(`/investment-returns/${id}`);
    }

    // Expense API methods
    async getExpenses() {
        return this.get('/expenses');
    }

    async createExpense(data) {
        return this.post('/expenses', data);
    }

    async updateExpense(id, data) {
        return this.put(`/expenses/${id}`, data);
    }

    async deleteExpense(id) {
        return this.delete(`/expenses/${id}`);
    }

    async getExpense(id) {
        return this.get(`/expenses/${id}`);
    }

    // Account API methods
    async getAccounts() {
        return this.get('/accounts');
    }

    async createAccount(data) {
        return this.post('/accounts', data);
    }

    async updateAccount(id, data) {
        return this.put(`/accounts/${id}`, data);
    }

    async deleteAccount(id) {
        return this.delete(`/accounts/${id}`);
    }

    async getAccount(id) {
        return this.get(`/accounts/${id}`);
    }

    // Transaction API methods
    async getTransactions() {
        return this.get('/transactions');
    }

    async createTransaction(data) {
        return this.post('/transactions', data);
    }

    async updateTransaction(id, data) {
        return this.put(`/transactions/${id}`, data);
    }

    async deleteTransaction(id) {
        return this.delete(`/transactions/${id}`);
    }

    async getTransaction(id) {
        return this.get(`/transactions/${id}`);
    }

    // Analytics API methods
    async getAnalytics() {
        return this.get('/analytics');
    }

    async getDashboardData() {
        return this.get('/analytics/dashboard');
    }

    async getPerformanceData() {
        return this.get('/analytics/performance');
    }

    // Audit Log API methods
    async getAuditLogs(filters = {}) {
        return this.get('/audit-logs', filters);
    }

    // Load all data at once
    async loadAllData() {
        try {
            const [investments, expenses, accounts, transactions, investmentReturns] = await Promise.all([
                this.getInvestments(),
                this.getExpenses(),
                this.getAccounts(),
                this.getTransactions(),
                this.getInvestmentReturns()
            ]);

            return {
                investments: investments.data || investments,
                expenses: expenses.data || expenses,
                accounts: accounts.data || accounts,
                transactions: transactions.data || transactions,
                investmentReturns: investmentReturns.data || investmentReturns
            };
        } catch (error) {
            console.error('Error loading all data:', error);
            throw error;
        }
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`Error ${context}:`, error);
        
        let message = 'An unexpected error occurred.';
        
        if (error.message) {
            if (error.message.includes('Failed to fetch')) {
                message = 'Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('422')) {
                message = 'Invalid data provided. Please check your inputs.';
            } else if (error.message.includes('404')) {
                message = 'The requested resource was not found.';
            } else if (error.message.includes('500')) {
                message = 'Server error occurred. Please try again later.';
            } else {
                message = error.message;
            }
        }
        
        this.showErrorMessage(message);
    }

    // Success message display
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // Error message display
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // Generic message display
    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.api-message');
        existingMessages.forEach(msg => msg.remove());

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `api-message api-message-${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease-out;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = '#10b981';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#f59e0b';
                break;
            default:
                messageDiv.style.backgroundColor = '#3b82f6';
        }

        messageDiv.textContent = message;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(messageDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);

        // Click to dismiss
        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        });
    }

    // Utility method to format validation errors
    formatValidationErrors(errors) {
        if (typeof errors === 'object' && errors !== null) {
            return Object.values(errors).flat().join(', ');
        }
        return errors || 'Validation failed';
    }
}

// Create global instance
const apiService = new ApiService();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiService;
}