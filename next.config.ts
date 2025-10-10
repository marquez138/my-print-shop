// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // If you already have a config, just add the Cloudinary host below
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        // optional, can be omitted; keeps it strict:
        // pathname: '/<your-cloud-name>/**',
      },
    ],
    // (optional) if you ever saw width errors, ensure 1200 is included
    // deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
}

export default nextConfig
