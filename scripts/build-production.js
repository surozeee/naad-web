#!/usr/bin/env node

/**
 * Production Build Script
 * Ensures production environment is used during build
 */

const { execSync } = require('child_process');

console.log('🚀 Starting production build...');

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
process.env.NEXT_PUBLIC_BACKEND_URL = 'https://api-naad.jojolapatech.com/api/v2';
process.env.NEXT_PUBLIC_FRONTEND_URL = 'https://naad.jojolapatech.com';
process.env.NEXT_PUBLIC_OAUTH_BASE_URL = 'https://iam-nad.jojolaptech.com';
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE = 'false';
process.env.PORT = '4000';

console.log('📋 Environment variables set:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  NEXT_PUBLIC_ENVIRONMENT: ${process.env.NEXT_PUBLIC_ENVIRONMENT}`);
console.log(`  NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
console.log(`  NEXT_PUBLIC_FRONTEND_URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
console.log(`  NEXT_PUBLIC_OAUTH_BASE_URL: ${process.env.NEXT_PUBLIC_OAUTH_BASE_URL}`);
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
