# 🚀 PM2 Deployment Guide - Method 1: Merge into Existing Ecosystem

This guide explains how to deploy the PDF Presentation System to a server that already has PM2 services running on ports 3000/5000.

## 📋 Prerequisites

- Server with existing PM2 services running
- Node.js installed on target server
- Git access to clone this repository
- Existing `ecosystem.config.js` file managing your current services

## 🎯 Overview

This method merges the PDF Presentation System (port 3002) into your existing PM2 ecosystem configuration, allowing centralized management of all services.

## 📁 Current Setup Assumption

Your server currently has:
- **Port 3000**: Your main application
- **Port 5000**: Your API service  
- **Port 3002**: Available for PDF Presentation System ✅

## 🛠️ Step-by-Step Deployment

### Step 1: Clone Repository on Target Server

```bash
# SSH into your target server
ssh user@your-server

# Clone the repository (choose a suitable location)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install dependencies
npm install

# Note the full path - you'll need this for ecosystem config
pwd
# Example output: /home/user/pdf-presentation-system
```

### Step 2: Prepare Your Existing Ecosystem File

Your current ecosystem file probably looks like this:

```javascript
// Your existing ecosystem.config.js
module.exports = {
  apps: [{
    name: 'main-app',
    script: './app.js',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }, {
    name: 'api-service',
    script: './api.js',
    env: {
      NODE_ENV: 'development', 
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### Step 3: Add PDF Presentation Configuration

Edit your existing `ecosystem.config.js` file and add the PDF Presentation app:

```javascript
// Updated ecosystem.config.js
module.exports = {
  apps: [
    // Your existing apps (keep as-is)
    {
      name: 'main-app',
      script: './app.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
      // ... rest of your existing config
    },
    {
      name: 'api-service',
      script: './api.js',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
      // ... rest of your existing config
    },
    
    // 🆕 ADD THIS: PDF Presentation System
    {
      name: 'pdf-presentation',
      script: 'server.js',
      cwd: '/home/user/pdf-presentation-system', // 👈 UPDATE WITH YOUR ACTUAL PATH
      instances: 1,
      exec_mode: 'fork',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      
      // PM2 options
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      
      // Logging (relative to cwd)
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart options
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      listen_timeout: 8000,
      kill_timeout: 5000
    }
  ]
};
```

### Step 4: Deploy and Restart Services

```bash
# Navigate to your main services directory (where your main ecosystem.config.js is)
cd /path/to/your/main/services

# Method A: Reload configuration (recommended for zero-downtime)
pm2 reload ecosystem.config.js --env production

# Method B: If reload doesn't work, restart all services
pm2 delete all
pm2 start ecosystem.config.js --env production

# Save PM2 configuration for auto-startup
pm2 save
```

### Step 5: Verify Deployment

```bash
# Check all services status
pm2 status

# Expected output:
# ┌─────┬────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
# │ id  │ name               │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
# ├─────┼────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
# │ 0   │ main-app           │ default     │ 1.0.0   │ fork    │ 1234     │ 5D     │ 0    │ online    │ 0%       │ 50.0mb   │ user     │ disabled │
# │ 1   │ api-service        │ default     │ 1.0.0   │ fork    │ 5678     │ 3D     │ 0    │ online    │ 0%       │ 80.0mb   │ user     │ disabled │
# │ 2   │ pdf-presentation   │ default     │ 1.0.0   │ fork    │ 9999     │ 0s     │ 0    │ online    │ 0%       │ 45.0mb   │ user     │ disabled │
# └─────┴────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

# Test the PDF presentation service
curl http://localhost:3002

# View logs for the new service
pm2 logs pdf-presentation
```

## 🌐 Access URLs

After successful deployment, your PDF Presentation System will be available at:

- **Home:** `http://YOUR_SERVER_IP:3002/`
- **Create Session:** `http://YOUR_SERVER_IP:3002/presenter`
- **Join Session:** `http://YOUR_SERVER_IP:3002/sessions`
- **Manage Sessions:** `http://YOUR_SERVER_IP:3002/manage`

## 🔧 Management Commands

### View All Services
```bash
pm2 status
```

### Manage Specific Service
```bash
# Restart PDF presentation service
pm2 restart pdf-presentation

# Stop PDF presentation service
pm2 stop pdf-presentation

# View logs
pm2 logs pdf-presentation

# View real-time logs
pm2 logs pdf-presentation --lines 50
```

### Manage All Services
```bash
# Restart all services
pm2 restart all

# Stop all services  
pm2 stop all

# View logs for all services
pm2 logs

# Real-time monitoring
pm2 monit
```

## 🔄 Update Process

When you need to update the PDF Presentation System:

```bash
# Navigate to PDF presentation directory
cd /path/to/pdf-presentation-system

# Pull latest changes
git pull

# Install any new dependencies (if package.json changed)
npm install

# Reload the service (zero-downtime)
pm2 reload pdf-presentation

# Or restart if needed
pm2 restart pdf-presentation
```

## 🛡️ Security & Firewall

Make sure port 3002 is open in your firewall:

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 3002

# CentOS/RHEL (firewalld) 
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --reload

# Check if port is accessible
curl http://localhost:3002
```

## 📊 Monitoring & Logging

### View Service Logs
```bash
# All logs
pm2 logs

# Specific service logs
pm2 logs pdf-presentation

# Error logs only
pm2 logs pdf-presentation --err

# Real-time monitoring
pm2 monit
```

### Log Management
```bash
# Flush logs
pm2 flush

# Rotate logs (install log rotation)
pm2 install pm2-logrotate
```

## 🚨 Troubleshooting

### Service Won't Start
```bash
# Check ecosystem config syntax
node -e "console.log(require('./ecosystem.config.js'))"

# Check if port is already in use
sudo lsof -i :3002

# Check service logs
pm2 logs pdf-presentation --err
```

### Memory Issues
```bash
# Check memory usage
pm2 monit

# Restart if using too much memory
pm2 restart pdf-presentation
```

### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/pdf-presentation-system

# Fix log directory permissions
mkdir -p /path/to/pdf-presentation-system/logs
chmod 755 /path/to/pdf-presentation-system/logs
```

## ✅ Advantages of Method 1

- ✅ **Centralized Management**: All services managed from one ecosystem file
- ✅ **Auto-startup**: All services start together on server boot
- ✅ **Unified Monitoring**: Single PM2 dashboard for all services
- ✅ **Easy Updates**: Simple reload commands for individual services
- ✅ **No Port Conflicts**: PDF system uses port 3002
- ✅ **Consistent Configuration**: Same PM2 settings across all services

## 📋 Final Checklist

- [ ] Repository cloned to target server
- [ ] Dependencies installed (`npm install`)
- [ ] Ecosystem config updated with correct `cwd` path
- [ ] PM2 services reloaded/restarted
- [ ] All services showing as "online" in `pm2 status`
- [ ] Port 3002 accessible via curl test
- [ ] Firewall configured to allow port 3002
- [ ] PM2 configuration saved (`pm2 save`)

## 🎯 Success Criteria

Your deployment is successful when:
1. All three services (ports 3000, 5000, 3002) show as "online" in PM2
2. You can access the PDF presentation system at `http://YOUR_SERVER_IP:3002`
3. Services automatically restart on server reboot
4. Logs are being written to the specified log files

---

**🎉 Congratulations!** Your PDF Presentation System is now deployed and integrated with your existing PM2 services! 