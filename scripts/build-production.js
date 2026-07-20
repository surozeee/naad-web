#!/usr/bin/env node

/**
 * Production Build Script
 * Ensures production environment is used during build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

const requiredPackages = ['next', 'next-auth', 'react', 'react-dom'];
const missing = requiredPackages.filter((name) => {
  try {
    require.resolve(name);
    return false;
  } catch {
    const pkgPath = path.join(process.cwd(), 'node_modules', name, 'package.json');
    return !fs.existsSync(pkgPath);
  }
});

if (missing.length) {
  console.error('❌ Missing required packages:', missing.join(', '));
  console.error('   Run: npm install');
  console.error('   Then: npm run build');
  process.exit(1);
}

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
process.env.BACKEND_URL = 'https://api-naad.jojolapatech.com';
process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api-naad.jojolapatech.com';
process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://naad.jojolapatech.com';
process.env.NEXT_PUBLIC_OAUTH_BASE_URL = 'https://auth-naad.jojolaptech.com';
process.env.NEXT_AUTH_XSRF_TOKEN = 'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=';
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE = 'false';
process.env.PORT = '4000';

console.log('📋 Environment variables set:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  NEXT_PUBLIC_ENVIRONMENT: ${process.env.NEXT_PUBLIC_ENVIRONMENT}`);
console.log(`  NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
console.log(`  NEXT_PUBLIC_FRONTEND_URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
console.log(`  NEXT_PUBLIC_OAUTH_BASE_URL: ${process.env.NEXT_PUBLIC_OAUTH_BASE_URL}`);
console.log(`  NEXT_AUTH_XSRF_TOKEN: ${process.env.NEXT_AUTH_XSRF_TOKEN}`);
console.log(`  PORT: ${process.env.PORT}`);

try {
  // Run the build command with cross-platform env handling
  console.log('🔨 Running build command...');
  execSync('next build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--require ./scripts/setup-globals.js',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });
  
  console.log('✅ Production build completed successfully!');
  console.log('');
  console.log('📝 Static files are in .next/static/');
  console.log('   These will be served automatically by Next.js server.');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
