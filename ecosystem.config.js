module.exports = {
  apps: [{
    name: 'mockup-studio',
    script: '.next/standalone/server.js',
    cwd: '/var/www/Mockup-Studio',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Wait for graceful shutdown
    kill_timeout: 5000,
    listen_timeout: 10000,
    shutdown_with_message: true
  }]
}

