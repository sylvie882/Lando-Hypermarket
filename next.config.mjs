/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/storage/**',
      },
      // Add these for the image URLs from your API
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '**', // Allow all paths from localhost
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '**', // Allow all paths from 127.0.0.1
      },
    ],
    // For local development, you might need to disable image optimization
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // IMPORTANT: Increase the body size limit for API routes
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  
  // Add this to allow external images without optimization
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;