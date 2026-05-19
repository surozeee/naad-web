/**
 * Ensures .next/dev/types exists before `next dev` (fixes Windows UNKNOWN errno -4094 on routes.d.ts).
 */
const fs = require('fs');
const path = require('path');

const devTypesDir = path.join(process.cwd(), '.next', 'dev', 'types');
const routesFile = path.join(devTypesDir, 'routes.d.ts');

function rmDirSafe(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch (err) {
    console.warn(`[prepare-dev] Could not remove ${dir}:`, err.message);
  }
}

rmDirSafe(devTypesDir);

try {
  fs.mkdirSync(devTypesDir, { recursive: true });
  const stub = [
    '/* Placeholder — Next.js overwrites this when the dev server generates route types. */',
    'type AppRoutes = string;',
    'type PageRoutes = string;',
    'type LayoutRoutes = string;',
    'type RedirectRoutes = string;',
    'type RewriteRoutes = string;',
    '',
  ].join('\n');
  fs.writeFileSync(routesFile, stub, { encoding: 'utf8', flag: 'w' });
} catch (err) {
  console.error('[prepare-dev] Failed to create routes.d.ts:', err.message);
  process.exit(1);
}

console.log('[prepare-dev] Ready:', routesFile);
