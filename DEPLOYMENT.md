# Haba Manager - Deployment Guide

This guide will help you deploy the Haba Manager application on a new computer or server.

## Prerequisites

### Required Software
- **Node.js** (version 14.0.0 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### System Requirements
- **Operating System**: Windows, macOS, or Linux
- **RAM**: Minimum 2GB
- **Storage**: At least 500MB free space
- **Network**: Internet connection for initial setup

## Installation Steps

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/haba-manager.git
cd haba-manager
```

### 2. Backend Setup

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration:
   ```env
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=http://localhost:8888
   DB_PATH=./database/haba_manager.db
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   LOG_LEVEL=info
   ```

#### Initialize the Database
```bash
npm run init-db
```

### 3. Frontend Setup

#### Install Frontend Dependencies
```bash
cd ..
npm install
```

## Running the Application

### Option 1: Using Startup Scripts (Recommended)

#### Windows
```bash
# Start both frontend and backend
.\launch.bat

# Or start backend only
.\start-server.bat
```

#### Linux/macOS
```bash
# Make scripts executable
chmod +x launch.ps1 start-server.ps1

# Start both frontend and backend
./launch.ps1

# Or start backend only
./start-server.ps1
```

### Option 2: Manual Startup

#### Start Backend Server
```bash
cd backend
npm start
```

#### Start Frontend Server (in a new terminal)
```bash
npm run serve
```

### 3. Access the Application
Open your web browser and navigate to:
- **Frontend**: http://localhost:8888
- **Backend API**: http://localhost:3001

## Production Deployment

### Option 1: Traditional VPS/Server Deployment

#### Prerequisites
- Ubuntu/CentOS server with root access
- Domain name (optional)
- SSL certificate (recommended)

#### Step 1: Server Setup

1. Update system packages:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. Install PM2 (Process Manager):
   ```bash
   sudo npm install -g pm2
   ```

#### Step 2: Deploy Application

1. Clone or upload your application:
   ```bash
   git clone https://github.com/YOUR_USERNAME/haba-manager.git
   cd haba-manager
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install --production
   ```

3. Set up environment:
   ```bash
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

4. Initialize database:
   ```bash
   npm run init-db
   ```

5. Start with PM2:
   ```bash
   pm2 start server.js --name "haba-manager"
   pm2 startup
   pm2 save
   ```

#### Step 3: Configure Reverse Proxy (Nginx)

1. Install Nginx:
   ```bash
   sudo apt install nginx -y
   ```

2. Create Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/haba-manager
   ```

3. Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/haba-manager /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Option 2: Docker Deployment

#### Step 1: Create Dockerfile

Create `Dockerfile` in the project root:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm ci --only=production

# Copy application files
COPY . .

# Create database directory
RUN mkdir -p backend/database

# Initialize database
RUN cd backend && npm run init-db

# Expose port
EXPOSE 3001

# Start application
CMD ["node", "backend/server.js"]
```

#### Step 2: Create docker-compose.yml

```yaml
version: '3.8'
services:
  haba-manager:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      - ./backend/database:/app/backend/database
    restart: unless-stopped
```

#### Step 3: Deploy with Docker

```bash
docker-compose up -d
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. Install Heroku CLI
2. Create Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Add buildpack:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   ```

5. Create Procfile:
   ```
   web: node backend/server.js
   ```

6. Deploy:
   ```bash
   git push heroku main
   ```

#### Railway/Render Deployment

1. Connect your GitHub repository
2. Set build command: `cd backend && npm install`
3. Set start command: `node backend/server.js`
4. Set environment variables as needed

## Environment Variables

Required environment variables for production:

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-domain.com
DB_PATH=./database/haba_manager.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Database Backup

Regular database backups are recommended:

```bash
# Create backup
cp backend/database/haba_manager.db backup/haba_manager_$(date +%Y%m%d_%H%M%S).db

# Restore backup
cp backup/haba_manager_YYYYMMDD_HHMMSS.db backend/database/haba_manager.db
```

## Monitoring and Maintenance

### PM2 Commands

```bash
# View logs
pm2 logs haba-manager

# Restart application
pm2 restart haba-manager

# Stop application
pm2 stop haba-manager

# View status
pm2 status
```

### Health Check

The application includes a health check endpoint:
```
GET /api/health
```

## Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Never commit .env files
3. **Rate Limiting**: Configured by default
4. **CORS**: Configure appropriate origins
5. **Database**: Regular backups and secure file permissions
6. **Updates**: Keep dependencies updated

## Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database permission errors**:
   ```bash
   chmod 755 backend/database
   chmod 644 backend/database/haba_manager.db
   ```

3. **Module not found errors**:
   ```bash
   cd backend && npm install
   ```

### Logs Location

- PM2 logs: `~/.pm2/logs/`
- Application logs: Console output
- Nginx logs: `/var/log/nginx/`

## GitHub Deployment (Static Hosting)

**Note**: GitHub Pages only supports static hosting. For full functionality, use one of the server deployment options above.

### Step 1: Initialize Git Repository

1. Initialize Git repository:
   ```bash
   git init
   ```

2. Add all files:
   ```bash
   git add .
   ```

3. Create initial commit:
   ```bash
   git commit -m "Initial commit: Haba Manager full-stack application"
   ```

### Step 2: Create GitHub Repository

1. Create new repository on GitHub
2. Connect local repository:
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