import type { NextConfig } from 'next';
import path from 'path';

const NAAD_API_BASE = 'https://api-naad.jojolapatech.com';

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
    // Social login (public client IDs — must be on next.config env for reliable client access)
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '',
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '',
  },
  // Prevent Turbopack from inferring workspace root as ./app
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
