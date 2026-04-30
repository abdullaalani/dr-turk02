module.exports = {
  apps: [{
    name: 'dr-turk02',
    script: 'node_modules/.bin/next',
    args: 'start',
    cwd: '/home/dr-turk02',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    time: true
  }]
};
