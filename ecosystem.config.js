module.exports = {
  apps: [
    {
      name: 'kurirta-api',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'kurirta-bot',
      script: 'bot/whatsapp-bot.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'kurirta-client',
      script: 'npx',
      args: 'serve -s client/build -l 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      interpreter: 'none'
    }
  ]
};
