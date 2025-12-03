/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone for VPS deployment, not for Vercel
  // Vercel uses serverless functions and doesn't need standalone mode
  ...(process.env.VERCEL ? {} : { output: 'standalone' }),
  images: {
    domains: ['localhost',"studio.nexgenbros.com"],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Exclude large directories from file tracing to prevent stack overflow
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu/**',
      'node_modules/@swc/core-linux-x64-musl/**',
      'node_modules/@esbuild/linux-x64/**',
      'public/uploads/**',
      'public/outputs/**',
      'prisma/dev.db*',
      '.git/**',
      '*.md',
      '*.sh',
      'ecosystem.config.js',
      'deploy.sh',
      'fix-pm2.sh',
      'DEPLOY.md',
      'FIX_*.md',
    ],
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


