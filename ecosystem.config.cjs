/**
 * PM2 ecosystem file for naad-web (Next.js).
 *
 * Server deploy (after git pull), from this directory (e.g. /home/web/naad-web):
 *   npm ci
 *   npm run build
 *   pm2 startOrReload ecosystem.config.cjs --env production
 *   pm2 save
 *
 * Note: .env* files are gitignored. Auth secrets are set below so PM2 can start
 * without a local .env.production. Override via server env or .env.production if needed.
 */
const path = require('path');

const appDir = path.resolve(__dirname);

const productionEnv = {
  NODE_ENV: 'production',
  PORT: '4000',
  NEXTAUTH_URL: 'https://naad.jojolapatech.com',
  NEXTAUTH_SECRET: 'naad-official-prod-nextauth-secret-min-32-chars',
  NEXTAUTH_XSRF_TOKEN: 'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=',
  NEXT_AUTH_XSRF_TOKEN: 'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=',
  NEXT_PUBLIC_XSRF_TOKEN: 'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=',
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'AIzaSyBP9Gw1tc3mGgHiTE3VAbXlMFrOM5rTBXg',
  GOOGLE_MAPS_API_KEY: 'AIzaSyBP9Gw1tc3mGgHiTE3VAbXlMFrOM5rTBXg',
  BACKEND_URL: 'https://api-naad.jojolapatech.com',
  NEXT_PUBLIC_BACKEND_URL: 'https://api-naad.jojolapatech.com',
  NEXT_PUBLIC_API_URL: 'https://api-naad.jojolapatech.com',
  NEXT_PUBLIC_FRONTEND_URL: 'https://naad.jojolapatech.com',
  NEXT_PUBLIC_APP_URL: 'https://naad.jojolapatech.com',
};

module.exports = {
  apps: [
    {
      name: 'naad-web',
      cwd: appDir,
      script: 'node',
      args: ['scripts/start-server.js'],
      interpreter: 'none',
      env: productionEnv,
      env_production: productionEnv,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      time: true,
    },
  ],
};
