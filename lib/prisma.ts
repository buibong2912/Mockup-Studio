import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Force new instance if schema changed
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn', 'query'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Always store in global to reuse connection
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

// In production, ensure connection is established
if (process.env.NODE_ENV === 'production') {
  // Try to connect, but don't block if it fails
  prisma.$connect().catch((error) => {
    console.error('[Prisma] Failed to connect to database:', error)
  })
}

// Handle disconnection on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
  
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

