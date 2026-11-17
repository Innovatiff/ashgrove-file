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
};

export default nextConfig;
