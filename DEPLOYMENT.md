# Deployment Guide for Haba Manager

This guide provides step-by-step instructions for deploying Haba Manager to various platforms.

## GitHub Deployment

### Prerequisites
- Git installed on your system
- GitHub account
- Command line access (Command Prompt, PowerShell, or Terminal)

### Step 1: Initialize Git Repository

1. Open Command Prompt or PowerShell in the project directory
2. Initialize Git repository:
   ```bash
   git init
   ```

3. Add all files to Git:
   ```bash
   git add .
   ```

4. Create initial commit:
   ```bash
   git commit -m "Initial commit: Haba Manager application"
   ```

### Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in repository details:
   - **Repository name**: `haba-manager`
   - **Description**: `Smart Money Management System`
   - **Visibility**: Public (for GitHub Pages)
   - **DO NOT** initialize with README, .gitignore, or license (already included)
5. Click "Create repository"

### Step 3: Connect Local Repository to GitHub

1. Copy the repository URL from GitHub
2. Add remote origin:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/haba-manager.git
   ```

3. Push to GitHub:
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click the "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"
7. Wait 5-10 minutes for deployment
8. Your app will be available at: `https://YOUR_USERNAME.github.io/haba-manager`

## Alternative Deployment Options

### Netlify Deployment

1. Go to [Netlify.com](https://netlify.com)
2. Sign up/Sign in with GitHub
3. Click "New site from Git"
4. Choose GitHub and select your repository
5. Deploy settings:
   - **Branch**: main
   - **Build command**: (leave empty)
   - **Publish directory**: (leave empty or set to "/")
6. Click "Deploy site"
7. Your app will be available at a Netlify URL

### Vercel Deployment

1. Go to [Vercel.com](https://vercel.com)
2. Sign up/Sign in with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Deploy settings:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
6. Click "Deploy"
7. Your app will be available at a Vercel URL

## Local Development Setup

### Using npm (Node.js)

1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run serve
   ```
4. Open `http://localhost:8888`

### Using Python

1. Install Python from [python.org](https://python.org)
2. Run the batch file (Windows):
   ```bash
   start-server.bat
   ```
   Or run PowerShell script:
   ```powershell
   .\start-server.ps1
   ```
   Or manually:
   ```bash
   python -m http.server 8888
   ```
3. Open `http://localhost:8888`

## Updating Your Deployment

Whenever you make changes to your application:

1. Add changes to Git:
   ```bash
   git add .
   ```

2. Commit changes:
   ```bash
   git commit -m "Description of changes"
   ```

3. Push to GitHub:
   ```bash
   git push origin main
   ```

4. GitHub Pages will automatically update (may take a few minutes)

## Custom Domain Setup (Optional)

### For GitHub Pages

1. Purchase a domain from a registrar
2. In your repository, go to Settings > Pages
3. Under "Custom domain", enter your domain
4. Create a CNAME file in your repository root with your domain
5. Configure DNS with your registrar:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

## Troubleshooting

### Common Issues

1. **404 Error on GitHub Pages**:
   - Check that `index.html` is in the root directory
   - Ensure GitHub Pages is enabled
   - Wait 10-15 minutes after enabling

2. **Git Push Rejected**:
   - Pull latest changes: `git pull origin main`
   - Resolve conflicts if any
   - Push again: `git push origin main`

3. **Application Not Loading**:
   - Check browser console for errors
   - Verify all files are uploaded
   - Check file paths are correct

### Getting Help

- Check GitHub repository issues
- Review browser console for error messages
- Verify all files are present and accessible
- Test locally before deploying

## Security Considerations

- All data is stored in browser localStorage
- No sensitive data is transmitted to servers
- Consider HTTPS for production (automatic with GitHub Pages)
- Regular backups recommended for important data

---

**Note**: This application is designed for personal use. For multi-user or enterprise deployment, consider implementing proper backend storage, user authentication, and data encryption.