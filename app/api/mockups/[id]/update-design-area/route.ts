import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { x, y, width, height } = await request.json()

    const mockup = await prisma.mockup.update({
      where: { id: params.id },
      data: {
        designAreaX: x,
        designAreaY: y,
        designAreaWidth: width,
        designAreaHeight: height,
      }
    })

    return NextResponse.json({ mockup })
  } catch (error) {
    console.error('Error updating design area:', error)
    return NextResponse.json(
      { error: 'Failed to update design area' },
      { status: 500 }
    )
  }
}


