# Haba Manager

A comprehensive financial management application for tracking investments, revenues, expenses, and account balances with detailed audit logging.

## Features

### 📊 Financial Management
- **Investment Tracking**: Record and monitor investment transactions
- **Revenue Management**: Track daily revenues and returns
- **Expense Monitoring**: Categorize and track business expenses
- **Account Management**: Manage multiple financial accounts
- **Balance Calculation**: Real-time remaining balance with revenue inclusion

### 📈 Analytics & Reporting
- **Dashboard Overview**: Visual summary of financial status
- **Trend Analysis**: Track financial trends over time
- **Detailed Reports**: Comprehensive financial reporting

### 🔍 Audit & Security
- **Comprehensive Audit Logs**: Track all financial operations with monetary details
- **User Activity Monitoring**: Monitor all system interactions
- **Data Integrity**: Secure data handling and validation
- **Rate Limiting**: API protection against abuse

### 💻 Technical Features
- **Full-Stack Application**: Node.js backend with modern frontend
- **RESTful API**: Clean API architecture
- **SQLite Database**: Lightweight, reliable data storage
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Dynamic data updates without page refresh

## Quick Start

### Prerequisites
- Node.js (version 14.0.0 or higher)
- npm (comes with Node.js)
- Git (optional, for cloning)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/haba-manager.git
   cd haba-manager
   ```

2. **Install dependencies**:
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ..
   npm install
   ```

3. **Configure environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Initialize database**:
   ```bash
   npm run init-db
   ```

### Running the Application

#### Option 1: Quick Launch (Windows)
```bash
# Start both frontend and backend
.\launch.bat
```

#### Option 2: Manual Start
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
npm run serve
```

### Access the Application
- **Frontend**: http://localhost:8888
- **Backend API**: http://localhost:3001

## Project Structure

```
haba-manager/
├── backend/                 # Node.js backend
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── database/           # Database files
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # Frontend assets
│   ├── index.html          # Main HTML file
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # Styling
├── launch.bat              # Windows startup script
├── start-server.bat        # Backend-only startup script
├── package.json            # Frontend dependencies
├── DEPLOYMENT.md           # Deployment guide
└── README.md               # This file
```

## API Endpoints

### Investments
- `GET /api/investments` - Get all investments
- `POST /api/investments` - Create new investment
- `PUT /api/investments/:id` - Update investment
- `DELETE /api/investments/:id` - Delete investment

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Expenses
- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Analytics
- `GET /api/analytics` - Get financial analytics
- `GET /api/audit-logs` - Get audit logs

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