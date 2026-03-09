/**
 * PM2 ecosystem file for naad-web (Next.js).
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 restart naad-web
 *   pm2 logs naad-web
 *   pm2 stop naad-web
 */
const path = require('path');

const appDir = path.resolve(__dirname);

module.exports = {
  apps: [
    {
      name: 'naad-web',
      cwd: appDir,
      script: 'node',
      args: ['scripts/start-server.js'],
      interpreter: 'none',
      env: { NODE_ENV: 'production' },
      env_production: { NODE_ENV: 'production' },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true,
    },
  ],
};
