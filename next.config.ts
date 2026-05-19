import type { NextConfig } from 'next';

const NAAD_API_BASE = 'https://api-naad.jojolapatech.com';

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL ?? NAAD_API_BASE,
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL ?? NAAD_API_BASE,
  },
};

export default nextConfig;
