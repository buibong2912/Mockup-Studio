/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone for VPS deployment, not for Vercel
  // Vercel uses serverless functions and doesn't need standalone mode
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  // Disable outputFileTracing on Vercel to prevent stack overflow
  // Vercel has its own file tracing mechanism
  ...(process.env.VERCEL ? { outputFileTracing: false } : {}),
  images: {
    domains: ['localhost',"studio.nexgenbros.com"],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
      {
        source: '/outputs/:path*',
        destination: '/api/uploads/outputs/:path*',
      },
    ]
  },
}

module.exports = nextConfig


