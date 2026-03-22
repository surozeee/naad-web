#!/usr/bin/env node

/**
 * Server Start Script
 * Starts Next.js server in production mode
 * Loads .env so NEXTAUTH_XSRF_TOKEN and other vars are available (fixes 403 XSRF token missing).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Project root = folder containing package.json (so .env loads even if started from another cwd)
const projectRoot = path.resolve(__dirname, '..');

// Load .env files without external deps (works in production where dotenv may not be installed)
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.replace(/#.*$/, '').trim();
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (match) {
        const key = match[1];
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1).replace(/\\n/g, '\n');
        }
        if (!process.env[key]) process.env[key] = value;
      }
    }
  } catch (_) { /* ignore */ }
}
const envFiles = ['.env', '.env.local', '.env.production', '.env.production.local'];
for (const file of envFiles) {
  const p = path.join(projectRoot, file);
  if (fs.existsSync(p)) loadEnvFile(p);
}

const hasXsrf = !!(process.env.NEXTAUTH_XSRF_TOKEN?.trim() || process.env.NEXT_AUTH_XSRF_TOKEN?.trim());
if (hasXsrf) {
  console.log('   XSRF token loaded (X-XSRF-TOKEN will be sent on each API request)');
} else {
  console.warn('   ⚠ XSRF token not set — add to .env: NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN=<value>');
  console.warn('   See ENV.md to fix "XSRF Token Missing" / 403');
}

console.log('🚀 Starting Next.js server...');

// Prepare environment (now includes vars from .env)
const env = {
  ...process.env,
  PORT: process.env.PORT || '4000',
  NODE_ENV: process.env.NODE_ENV || 'production',
};

// Set up NODE_OPTIONS if setup-globals.js exists
const setupGlobalsPath = path.join(projectRoot, 'scripts', 'setup-globals.js');
if (fs.existsSync(setupGlobalsPath)) {
  const existingNodeOptions = env.NODE_OPTIONS || '';
  env.NODE_OPTIONS = `${existingNodeOptions} --require ${setupGlobalsPath}`.trim();
  console.log('   Using setup-globals.js');
}

// Use next binary from node_modules (or system)
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

// Avoid shell:true + args (Node DEP0190); invoke Next CLI via node when available
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

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  nextStart.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  nextStart.kill('SIGINT');
});

