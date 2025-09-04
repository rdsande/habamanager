# Haba Manager - Smart Money Management System

A comprehensive web-based application for managing investments, expenses, and financial accounts with real-time analytics and performance tracking.

## Features

- **Dashboard**: Overview of portfolio performance, active investments, and financial metrics
- **Investment Management**: Track business investments with daily revenue monitoring
- **Expense Tracking**: Categorize and monitor business expenses
- **Account Management**: Manage multiple bank accounts with transaction history
- **Performance Analytics**: Visual charts and break-even analysis
- **Real-time Updates**: Live financial data with trend indicators

## Data Storage

The application uses **browser localStorage** for data persistence. All data is stored locally in your browser and includes:

- **Investments**: Business investment records with daily revenues
- **Expenses**: Categorized expense tracking
- **Accounts**: Bank account information and balances
- **Transactions**: Complete transaction history
- **Daily Revenues**: Historical revenue data for performance analysis

### Data Location
- **Storage Type**: Browser localStorage (client-side)
- **Data Format**: JSON objects
- **Persistence**: Data persists until browser cache is cleared
- **Backup**: Manual export/import functionality (can be added)

### Important Notes
- Data is stored locally in your browser
- Clearing browser data will remove all records
- Data is not automatically synced across devices
- Consider regular backups for important data

## Installation Guide for Windows

### Prerequisites

1. **Web Browser**: Chrome, Firefox, Safari, or Edge (latest version)
2. **Local Web Server** (choose one):
   - Python (recommended)
   - Node.js with http-server
   - XAMPP/WAMP
   - Live Server (VS Code extension)

### Method 1: Using Python (Recommended)

#### Step 1: Install Python
1. Download Python from [python.org](https://www.python.org/downloads/)
2. During installation, check "Add Python to PATH"
3. Verify installation by opening Command Prompt and typing:
   ```cmd
   python --version
   ```

#### Step 2: Download the Application
1. Clone or download this repository
2. Extract files to a folder (e.g., `C:\habamanager`)

#### Step 3: Run the Application
1. Open Command Prompt as Administrator
2. Navigate to the application folder:
   ```cmd
   cd C:\habamanager
   ```
3. Start the web server:
   ```cmd
   python -m http.server 8888
   ```
4. Open your browser and go to: `http://localhost:8888`

### Method 2: Using Node.js

#### Step 1: Install Node.js
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install with default settings
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### Step 2: Install http-server
```cmd
npm install -g http-server
```

#### Step 3: Run the Application
1. Navigate to application folder:
   ```cmd
   cd C:\habamanager
   ```
2. Start the server:
   ```cmd
   http-server -p 8888
   ```
3. Open browser to: `http://localhost:8888`

### Method 3: Using XAMPP

#### Step 1: Install XAMPP
1. Download XAMPP from [apachefriends.org](https://www.apachefriends.org/)
2. Install with default settings
3. Start Apache service from XAMPP Control Panel

#### Step 2: Deploy Application
1. Copy application files to `C:\xampp\htdocs\habamanager`
2. Open browser to: `http://localhost/habamanager`

### Method 4: Using VS Code Live Server

#### Step 1: Install VS Code
1. Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. Install Live Server extension

#### Step 2: Run Application
1. Open application folder in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## GitHub Deployment

### Preparing for GitHub

1. **Initialize Git Repository**:
   ```cmd
   cd C:\habamanager
   git init
   git add .
   git commit -m "Initial commit: Haba Manager application"
   ```

2. **Create .gitignore** (optional):
   ```
   # OS generated files
   .DS_Store
   Thumbs.db
   
   # Editor files
   .vscode/
   .idea/
   
   # Temporary files
   *.tmp
   *.log
   ```

3. **Create GitHub Repository**:
   - Go to [github.com](https://github.com)
   - Click "New Repository"
   - Name it "haba-manager"
   - Don't initialize with README (you already have one)

4. **Push to GitHub**:
   ```cmd
   git remote add origin https://github.com/yourusername/haba-manager.git
   git branch -M main
   git push -u origin main
   ```

### GitHub Pages Deployment

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)"
6. Click "Save"
7. Your app will be available at: `https://yourusername.github.io/haba-manager`

## File Structure

```
habamanager/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── README.md           # This documentation
└── .gitignore         # Git ignore file (optional)
```

## Usage

1. **First Time Setup**:
   - Add your bank accounts
   - Create your first investment
   - Start tracking expenses

2. **Daily Operations**:
   - Update daily revenues
   - Record expenses
   - Monitor performance metrics

3. **Financial Tracking**:
   - View dashboard analytics
   - Check break-even progress
   - Analyze investment performance

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### Common Issues

1. **Application won't load**:
   - Ensure web server is running
   - Check browser console for errors
   - Verify file permissions

2. **Data not saving**:
   - Check if localStorage is enabled
   - Ensure browser allows local storage
   - Try incognito/private mode

3. **Charts not displaying**:
   - Verify internet connection (Chart.js CDN)
   - Check browser console for errors
   - Ensure JavaScript is enabled

### Support

For issues or questions:
1. Check browser console for error messages
2. Verify all files are present and accessible
3. Ensure web server is properly configured

## Security Notes

- All data is stored locally in browser
- No data is transmitted to external servers
- Use HTTPS in production environments
- Regular backups recommended

## License

This project is open source and available under the MIT License.

---

**Note**: This application is designed for local use and development. For production deployment, consider implementing proper backend storage, user authentication, and data encryption.