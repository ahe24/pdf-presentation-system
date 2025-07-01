// Merged ecosystem.config.js for your server
// This shows how to integrate PDF Presentation System with your existing services

module.exports = {
  apps: [
    // Your existing backend service (unchanged)
    {
      name: 'ednc-backend',
      script: './dist/server.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    
    // Your existing frontend service (unchanged)
    {
      name: 'ednc-frontend',
      script: 'npx',
      args: 'serve -s build -p 3000',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log'
    },
    
    // 🆕 NEW: PDF Presentation System
    {
      name: 'pdf-presentation',
      script: 'server.js',
      cwd: '/path/to/pdf-presentation-system', // 👈 UPDATE THIS PATH
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      min_uptime: '10s',
      max_restarts: 10,
      error_file: './logs/pdf-error.log',
      out_file: './logs/pdf-out.log',
      log_file: './logs/pdf-combined.log'
    }
  ]
}; 