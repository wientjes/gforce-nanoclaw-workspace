module.exports = {
  apps: [{
    name: 'gforce-bot',
    script: './telegram-bot-ai.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env_file: '.telegram/.env',
    env: {
      NODE_ENV: 'production',
      ANTHROPIC_API_KEY: 'YOUR_ANTHROPIC_API_KEY',
      BRAVE_API_KEY: 'YOUR_BRAVE_API_KEY'
    },
    error_file: 'logs/telegram-error.log',
    out_file: 'logs/telegram-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
