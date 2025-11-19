import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Get total count
    const totalCount = await prisma.mockup.count()
    
    // Get all mockups with detailed info
    const mockups = await prisma.mockup.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 for debugging
    })

    // Get database info
    const dbInfo = {
      provider: process.env.DATABASE_URL ? 
        (process.env.DATABASE_URL.includes('postgres') ? 'postgresql' : 
         process.env.DATABASE_URL.includes('sqlite') ? 'sqlite' : 'unknown') : 'unknown',
      url: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'not set'
    }

    return NextResponse.json({
      success: true,
      totalCount,
      mockupsCount: mockups.length,
      mockups,
      database: dbInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      database: {
        provider: process.env.DATABASE_URL ? 
          (process.env.DATABASE_URL.includes('postgres') ? 'postgresql' : 
           process.env.DATABASE_URL.includes('sqlite') ? 'sqlite' : 'unknown') : 'unknown',
        url: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'not set'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

