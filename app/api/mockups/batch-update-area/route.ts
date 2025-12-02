import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { mockupIds, area } = await request.json()

    if (!mockupIds || !Array.isArray(mockupIds) || mockupIds.length === 0) {
      return NextResponse.json(
        { error: 'mockupIds must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!area || typeof area.x !== 'number' || typeof area.y !== 'number' || 
        typeof area.width !== 'number' || typeof area.height !== 'number') {
      return NextResponse.json(
        { error: 'Invalid area data' },
        { status: 400 }
      )
    }

    // Update all selected mockups with the same area
    const updatedMockups = await prisma.$transaction(
      mockupIds.map((id: string) =>
        prisma.mockup.update({
          where: { id },
          data: {
            designAreaX: area.x,
            designAreaY: area.y,
            designAreaWidth: area.width,
            designAreaHeight: area.height,
            designAreaRotation: area.rotation !== undefined ? area.rotation : 0,
          }
        })
      )
    )

    return NextResponse.json({ mockups: updatedMockups }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('Error batch updating design areas:', error)
    return NextResponse.json(
      { error: 'Failed to batch update design areas' },
      { status: 500 }
    )
  }
}

