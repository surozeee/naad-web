#!/usr/bin/env node

/**
 * Server Start Script
 * Starts Next.js server in production mode
 * Loads .env so NEXTAUTH_XSRF_TOKEN and other vars are available (fixes 403 XSRF token missing).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env before spawning Next.js (ensures NEXTAUTH_XSRF_TOKEN etc. for production start)
const projectRoot = process.cwd();
const loadEnv = (file) => {
  const p = path.join(projectRoot, file);
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
  }
};
loadEnv('.env');
loadEnv('.env.local');
loadEnv('.env.production');
loadEnv('.env.production.local');
if (process.env.NEXTAUTH_XSRF_TOKEN) {
  console.log('   NEXTAUTH_XSRF_TOKEN loaded for X-XSRF-TOKEN');
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

console.log(`📦 Using Next.js binary: ${nextCommand}`);
console.log(`🌐 Server will start on port: ${env.PORT}`);
console.log(`📁 Working directory: ${projectRoot}`);

const nextStart = spawn(nextCommand, ['start'], {
  stdio: 'inherit',
  env,
  shell: true,
  cwd: projectRoot, // Explicitly set working directory
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

