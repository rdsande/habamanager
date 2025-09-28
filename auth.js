// Authentication management for SMM
class AuthManager {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = localStorage.getItem('smm_token');
        this.user = JSON.parse(localStorage.getItem('smm_user') || 'null');
    }

    init() {
        // Only redirect if we're on login page and user is already logged in
        if (this.token && this.user && (window.location.pathname.includes('login.html') || window.location.pathname === '/')) {
            this.redirectToApp();
        }

        // Set up form event listeners only if we're on login page
        if (window.location.pathname.includes('login.html') || document.getElementById('login-form')) {
            this.setupEventListeners();
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchLink = document.getElementById('switch-link');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        if (switchLink) {
            switchLink.addEventListener('click', (e) => this.switchForms(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        this.setLoading('login-btn', true);
        this.hideMessages();
        
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.setToken(data.data.token);
                this.setUser(data.data.user);
                this.showSuccess('Login successful! Redirecting...');
                
                setTimeout(() => {
                    this.redirectToApp();
                }, 1000);
            } else {
                this.showError(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please check your connection.');
        } finally {
            this.setLoading('login-btn', false);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Validate passwords match
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }
        
        this.setLoading('register-btn', true);
        this.hideMessages();
        
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: name, email, password, fullName: name })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.setToken(data.data.token);
                this.setUser(data.data.user);
                this.showSuccess('Account created successfully! Redirecting...');
                
                setTimeout(() => {
                    this.redirectToApp();
                }, 1000);
            } else {
                this.showError(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please check your connection.');
        } finally {
            this.setLoading('register-btn', false);
        }
    }

    switchForms(e) {
        e.preventDefault();
        
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const switchText = document.getElementById('switch-text');
        const switchLink = document.getElementById('switch-link');
        
        this.hideMessages();
        
        if (loginForm.style.display !== 'none') {
            // Switch to register
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            switchText.textContent = 'Already have an account?';
            switchLink.textContent = 'Sign in';
        } else {
            // Switch to login
            loginForm.style.display = 'flex';
            registerForm.style.display = 'none';
            switchText.textContent = "Don't have an account?";
            switchLink.textContent = 'Sign up';
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('smm_token', token);
    }

    setUser(user) {
        this.user = user;
        localStorage.setItem('smm_user', JSON.stringify(user));
    }

    getToken() {
        return this.token || localStorage.getItem('smm_token');
    }

    getUser() {
        return this.user || JSON.parse(localStorage.getItem('smm_user') || 'null');
    }

    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('smm_token');
        localStorage.removeItem('smm_user');
        window.location.href = 'login.html';
    }

    isAuthenticated() {
        return !!(this.getToken() && this.getUser());
    }

    redirectToApp() {
        window.location.href = 'index.html';
    }

    setLoading(buttonId, loading) {
        const button = document.getElementById(buttonId);
        const btnText = button.querySelector('.btn-text');
        const loadingSpinner = button.querySelector('.loading');
        
        if (loading) {
            button.disabled = true;
            btnText.style.display = 'none';
            loadingSpinner.style.display = 'inline-block';
        } else {
            button.disabled = false;
            btnText.style.display = 'inline';
            loadingSpinner.style.display = 'none';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('success-message');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }

    hideMessages() {
        const errorDiv = document.getElementById('error-message');
        const successDiv = document.getElementById('success-message');
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }

    // Method to make authenticated API requests
    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            this.logout();
            return null;
        }
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, mergedOptions);
            
            if (response.status === 401) {
                // Token expired or invalid
                this.logout();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }
}

// Initialize auth manager when script loads
const authManager = new AuthManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.AuthManager = authManager;
    window.authManager = authManager; // Keep both for compatibility
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => authManager.init());
    } else {
        authManager.init();
    }
}