import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['books.google.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'books.google.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
