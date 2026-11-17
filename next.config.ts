import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export: `next build` writes plain HTML/CSS/JS to /out, which
  // Firebase Hosting serves. There is no Next.js server, no API route and no
  // middleware. Every piece of server logic lives in Cloud Functions.
  output: 'export',
  images: { unoptimized: true },
  // /oath is emitted as oath.html and served at /oath by Hosting's cleanUrls.
  trailingSlash: false,
  reactStrictMode: true,
  experimental: {
    // The main website and each escape room have their own root layout, so
    // there is no single layout to build a 404 from. app/global-not-found.tsx
    // is the one page every unmatched address gets.
    globalNotFound: true,
  },
};

export default nextConfig;
