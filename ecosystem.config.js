module.exports = {
  apps: [{
    name: 'pdf-presentation',
    script: 'server.js',
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
    
    // Logging
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
  }]
}; 