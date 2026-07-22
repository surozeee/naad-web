import type { NextConfig } from 'next';
import path from 'path';

const NAAD_API_BASE = 'https://api-naad.jojolapatech.com';

/** Public OAuth client IDs (safe in the browser). Used when env files are missing at config load. */
const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  '440931120883-btid3s6k65qstivrg1b55ep2f8bmefc5.apps.googleusercontent.com';
const FACEBOOK_APP_ID =
  process.env.NEXT_PUBLIC_FACEBOOK_APP_ID?.trim() || '1401339005236361';

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? NAAD_API_BASE,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? NAAD_API_BASE,
    // Expose XSRF to the browser when only the server env var is set (erp-web pattern).
    NEXT_PUBLIC_XSRF_TOKEN:
      process.env.NEXT_PUBLIC_XSRF_TOKEN ??
      process.env.NEXTAUTH_XSRF_TOKEN ??
      process.env.NEXT_AUTH_XSRF_TOKEN ??
      '',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_FACEBOOK_APP_ID: FACEBOOK_APP_ID,
  },
  // Prevent Turbopack from inferring workspace root as ./app
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
