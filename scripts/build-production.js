#!/usr/bin/env node

/**
 * Production Build Script
 * Ensures production environment is used during build
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting production build...');

/**
 * Load KEY=VALUE from a file (later files override earlier).
 * Required so NEXT_PUBLIC_* vars (e.g. Google Maps) are baked into the client bundle.
 */
function loadEnvFile(filePath) {
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
      process.env[key] = value;
    }
  } catch {
    /* ignore missing files */
  }
}

const projectRoot = process.cwd();
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const p = path.join(projectRoot, file);
  if (fs.existsSync(p)) {
    loadEnvFile(p);
    console.log(`📄 Loaded ${file}`);
  }
}

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

// Set production environment variables (do not overwrite secrets already in the shell / env files)
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
process.env.BACKEND_URL = process.env.BACKEND_URL || 'https://api-naad.jojolapatech.com';
process.env.NEXT_PUBLIC_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-naad.jojolapatech.com';
process.env.NEXT_PUBLIC_FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://naad.jojolapatech.com';
process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://naad.jojolapatech.com';
process.env.NEXT_PUBLIC_OAUTH_BASE_URL =
  process.env.NEXT_PUBLIC_OAUTH_BASE_URL || 'https://auth-naad.jojolaptech.com';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'https://naad.jojolapatech.com';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || 'naad-official-prod-nextauth-secret-min-32-chars';
process.env.NEXTAUTH_XSRF_TOKEN =
  process.env.NEXTAUTH_XSRF_TOKEN ||
  process.env.NEXT_AUTH_XSRF_TOKEN ||
  'BquLOJXXt2ng415MpvK4a8F0CF/w/1iawsnFqHzPGeo=';
process.env.NEXT_AUTH_XSRF_TOKEN =
  process.env.NEXT_AUTH_XSRF_TOKEN || process.env.NEXTAUTH_XSRF_TOKEN;
process.env.NEXT_PUBLIC_XSRF_TOKEN =
  process.env.NEXT_PUBLIC_XSRF_TOKEN || process.env.NEXTAUTH_XSRF_TOKEN;
process.env.NEXT_PUBLIC_ENABLE_ANALYTICS = 'true';
process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE = 'false';
process.env.PORT = process.env.PORT || '4000';

const mapsKey = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
if (!mapsKey) {
  console.warn('⚠ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set — birth chart map place selection will be disabled.');
  console.warn('  Add it to .env.production before building (see ENV.md).');
}

console.log('📋 Environment variables set:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`  NEXT_PUBLIC_ENVIRONMENT: ${process.env.NEXT_PUBLIC_ENVIRONMENT}`);
console.log(`  NEXT_PUBLIC_BACKEND_URL: ${process.env.NEXT_PUBLIC_BACKEND_URL}`);
console.log(`  NEXT_PUBLIC_FRONTEND_URL: ${process.env.NEXT_PUBLIC_FRONTEND_URL}`);
console.log(`  NEXT_PUBLIC_OAUTH_BASE_URL: ${process.env.NEXT_PUBLIC_OAUTH_BASE_URL}`);
console.log(`  NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
console.log(`  NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '***set***' : '(missing)'}`);
console.log(`  NEXTAUTH_XSRF_TOKEN: ${process.env.NEXTAUTH_XSRF_TOKEN ? '***set***' : '(missing)'}`);
console.log(`  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: ${mapsKey ? '***set***' : '(missing)'}`);
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
