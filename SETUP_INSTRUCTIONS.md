# Haba Manager - Setup Instructions

## Quick Start Guide

### 🚀 One-Click Setup

1. **Run the setup script** (choose one):
   - **Windows Batch**: Double-click `setup.bat`
   - **PowerShell**: Right-click `setup.ps1` → "Run with PowerShell"

2. **Launch the application** (choose one):
   - Double-click the "Haba Manager" shortcut on your desktop
   - Double-click `launch.bat`
   - Right-click `launch.ps1` → "Run with PowerShell"

### 📋 What the Setup Does

The setup script will automatically:
- ✅ Check if Node.js is installed (guide you to install if missing)
- ✅ Install all frontend dependencies
- ✅ Install all backend dependencies
- ✅ Create environment configuration file
- ✅ Initialize the database
- ✅ Create a desktop shortcut for easy access

### 🎯 System Requirements

- **Node.js** (version 14.0.0 or higher)
- **Windows** operating system
- **Internet connection** (for downloading dependencies)

## Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Install Node.js
- Go to [nodejs.org](https://nodejs.org/)
- Download and install the LTS version
- Restart your computer after installation

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment
```bash
cd backend
copy .env.example .env
cd ..
```

### 4. Initialize Database
```bash
cd backend
npm run init-db
cd ..
```

## 🚀 Launching the Application

### Option 1: Desktop Shortcut
- Double-click the "Haba Manager" shortcut created on your desktop

### Option 2: Batch File
- Double-click `launch.bat` in the project folder

### Option 3: PowerShell Script
- Right-click `launch.ps1` → "Run with PowerShell"

### Option 4: Manual Launch
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
npm run serve
```

## 🌐 Accessing the Application

Once launched, the application will be available at:
- **Frontend**: http://localhost:8888
- **Backend API**: http://localhost:3001

The application will automatically open in your default web browser.

## 🛑 Stopping the Application

To stop the application:
- Close both server windows that opened
- Or press `Ctrl+C` in each server window

## 🔧 Troubleshooting

### Node.js Not Found
- **Problem**: "node is not recognized as a command"
- **Solution**: Install Node.js from [nodejs.org](https://nodejs.org/) and restart your computer

### Dependencies Installation Failed
- **Problem**: npm install errors
- **Solution**: 
  1. Delete `node_modules` folders
  2. Run setup script again
  3. Check your internet connection

### Port Already in Use
- **Problem**: "Port 3001 or 8888 already in use"
- **Solution**: 
  1. Close any other applications using these ports
  2. Restart your computer
  3. Try launching again

### Database Issues
- **Problem**: Database errors on startup
- **Solution**: 
  1. Delete `backend/database/haba_manager.db`
  2. Run `cd backend && npm run init-db`

## 📁 Project Structure

```
haba-manager/
├── setup.bat              # Windows setup script
├── setup.ps1              # PowerShell setup script
├── launch.bat             # Windows launcher
├── launch.ps1             # PowerShell launcher
├── index.html             # Main frontend file
├── package.json           # Frontend dependencies
├── backend/
│   ├── server.js          # Backend server
│   ├── package.json       # Backend dependencies
│   ├── .env.example       # Environment template
│   └── database/          # Database files
└── Desktop Shortcut       # Created after setup
```

## 🆘 Getting Help

If you encounter any issues:
1. Check this troubleshooting guide
2. Ensure Node.js is properly installed
3. Try running the setup script again
4. Check that no other applications are using ports 3001 or 8888

## 🎉 Success!

Once everything is set up, you'll have:
- ✅ A fully functional financial management application
- ✅ Desktop shortcut for easy access
- ✅ Automatic browser opening
- ✅ Both frontend and backend servers running

Enjoy using Haba Manager for your financial tracking needs!