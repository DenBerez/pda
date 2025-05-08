import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  devIndicators: false,


  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },



  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'development'
              ? "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; font-src 'self' data:; img-src 'self' data: https://*.unsplash.com https://picsum.photos https://*.picsum.photos https://cdn.weatherapi.com https://p.scdn.co https://upload.wikimedia.org https://i.scdn.co https://*.oaiusercontent.com; media-src 'self' https://p.scdn.co https://upload.wikimedia.org;"
              : "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://*.unsplash.com https://picsum.photos https://*.picsum.photos https://cdn.weatherapi.com https://p.scdn.co https://upload.wikimedia.org https://i.scdn.co; media-src 'self' https://p.scdn.co https://upload.wikimedia.org;"
          },
        ],
      },
    ];
  },
};

export default nextConfig;
