/**
 * PM2 ecosystem file for naad-web (Next.js).
 *
 * Server deploy (after git pull), from this directory (e.g. /home/web/naad-web):
 *   npm ci
 *   npm run build          ← required: creates .next/; without it next start exits with code 1
 *   Ensure .env has NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN (see ENV.md)
 *   pm2 restart naad-web
 *
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
