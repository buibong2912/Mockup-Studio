import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /api/mockups] ========== Starting request ==========')
    console.log('[GET /api/mockups] DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('[GET /api/mockups] NODE_ENV:', process.env.NODE_ENV)
    console.log('[GET /api/mockups] Timestamp:', new Date().toISOString())
    
    // Test database connection first
    try {
      // Try to connect, but don't throw if already connected
      await prisma.$connect().catch(() => {
        // Connection might already be established, that's okay
        console.log('[GET /api/mockups] Connection already established or failed silently')
      })
      console.log('[GET /api/mockups] Database connection ready')
    } catch (connectError) {
      console.error('[GET /api/mockups] Database connection failed:', connectError)
      // Try to continue anyway, might be a connection pool issue
    }
    
    // Get count first to verify connection
    const count = await prisma.mockup.count()
    console.log(`[GET /api/mockups] Total mockups in database: ${count}`)
    
    const mockups = await prisma.mockup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`[GET /api/mockups] Query returned ${mockups.length} mockups`)
    if (mockups.length > 0) {
      console.log(`[GET /api/mockups] First mockup:`, {
        id: mockups[0].id,
        name: mockups[0].name,
        imageUrl: mockups[0].imageUrl,
        createdAt: mockups[0].createdAt
      })
      if (mockups.length > 1) {
        console.log(`[GET /api/mockups] Last mockup:`, {
          id: mockups[mockups.length - 1].id,
          name: mockups[mockups.length - 1].name,
          createdAt: mockups[mockups.length - 1].createdAt
        })
      }
    } else {
      console.warn('[GET /api/mockups] WARNING: No mockups found, but count shows:', count)
    }
    
    console.log('[GET /api/mockups] ========== Request completed successfully ==========')
    
    return NextResponse.json({ mockups }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[GET /api/mockups] ========== ERROR ==========')
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


