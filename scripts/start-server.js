#!/usr/bin/env node

/**
 * Server Start Script
 * Starts Next.js server in production mode.
 * Loads .env so NEXTAUTH_SECRET / XSRF and other vars are available.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

/**
 * Load KEY=VALUE from a file.
 * Later files override earlier ones (Next.js-style).
 * Empty values are ignored so `NEXTAUTH_SECRET=` does not wipe a real secret.
 */
function loadEnvFile(filePath, { override = true } = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.replace(/#.*$/, '').trim();
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1).replace(/\\n/g, '\n');
      }
      if (!value) continue;
      if (!override && process.env[key]) continue;
      process.env[key] = value;
    }
  } catch {
    /* ignore missing files */
  }
}

// Base → local → production (later wins). Matches Next.js precedence.
const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
for (const file of envFiles) {
  const p = path.join(projectRoot, file);
  if (fs.existsSync(p)) loadEnvFile(p, { override: true });
}

function hasSecret(name) {
  return Boolean(process.env[name]?.trim());
}

if (!hasSecret('NEXTAUTH_SECRET')) {
  console.error('❌ NEXTAUTH_SECRET is missing or empty.');
  console.error('   Login cannot create session cookies without it.');
  console.error('   Add to .env.production (or server env):');
  console.error('   NEXTAUTH_SECRET=<random-string-at-least-32-chars>');
  console.error('   Then: pm2 restart / npm start');
  process.exit(1);
}

if (!hasSecret('NEXTAUTH_URL')) {
  console.warn('   ⚠ NEXTAUTH_URL not set — defaulting to https://naad.jojolapatech.com');
  process.env.NEXTAUTH_URL = 'https://naad.jojolapatech.com';
}

const hasXsrf = !!(
  process.env.NEXTAUTH_XSRF_TOKEN?.trim() || process.env.NEXT_AUTH_XSRF_TOKEN?.trim()
);
if (hasXsrf) {
  console.log('   XSRF token loaded (X-XSRF-TOKEN will be sent on each API request)');
} else {
  console.warn('   ⚠ XSRF token not set — add NEXTAUTH_XSRF_TOKEN to .env.production');
  console.warn('   See ENV.md to fix "XSRF Token Missing" / 403');
}

console.log('🚀 Starting Next.js server...');
console.log(`   NEXTAUTH_URL=${process.env.NEXTAUTH_URL}`);
console.log('   NEXTAUTH_SECRET=***set***');

const env = {
  ...process.env,
  PORT: process.env.PORT || '4000',
  NODE_ENV: process.env.NODE_ENV || 'production',
};

const setupGlobalsPath = path.join(projectRoot, 'scripts', 'setup-globals.js');
if (fs.existsSync(setupGlobalsPath)) {
  const existingNodeOptions = env.NODE_OPTIONS || '';
  env.NODE_OPTIONS = `${existingNodeOptions} --require ${setupGlobalsPath}`.trim();
  console.log('   Using setup-globals.js');
}

const nextBin = path.join(projectRoot, 'node_modules', '.bin', 'next');
const nextCommand = fs.existsSync(nextBin) ? nextBin : 'next';
const nextCliJs = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
const useNodeCli = fs.existsSync(nextCliJs);

console.log(`📦 Using Next.js: ${useNodeCli ? nextCliJs : nextCommand}`);
console.log(`🌐 Server will start on port: ${env.PORT}`);
console.log(`📁 Working directory: ${projectRoot}`);

const buildIdPath = path.join(projectRoot, '.next', 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.error('❌ No production build found (.next/BUILD_ID missing).');
  console.error('   On the server, from the app directory run: npm run build');
  console.error('   Then start again: npm start   (or: pm2 restart naad-web)');
  process.exit(1);
}

const nextStart = useNodeCli
  ? spawn(process.execPath, [nextCliJs, 'start'], {
      stdio: 'inherit',
      env,
      cwd: projectRoot,
    })
  : spawn(nextCommand, ['start'], {
      stdio: 'inherit',
      env,
      cwd: projectRoot,
      shell: process.platform === 'win32',
    });

nextStart.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

nextStart.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  nextStart.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  nextStart.kill('SIGINT');
});
