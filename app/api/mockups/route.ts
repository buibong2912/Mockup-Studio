import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/mockups] Starting request...')
    console.log('[GET /api/mockups] DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('[GET /api/mockups] NODE_ENV:', process.env.NODE_ENV)
    
    // Test database connection first
    try {
      await prisma.$connect()
      console.log('[GET /api/mockups] Database connected')
    } catch (connectError) {
      console.error('[GET /api/mockups] Database connection failed:', connectError)
      throw connectError
    }
    
    const mockups = await prisma.mockup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[GET /api/mockups] Found ${mockups.length} mockups`)
    if (mockups.length > 0) {
      console.log(`[GET /api/mockups] First mockup:`, {
        id: mockups[0].id,
        name: mockups[0].name,
        imageUrl: mockups[0].imageUrl
      })
    }
    
    return NextResponse.json({ mockups }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[GET /api/mockups] Error fetching mockups:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[GET /api/mockups] Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch mockups',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'Check server logs for details'
      },
      { status: 500 }
    )
  }
}


