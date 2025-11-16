import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const mockups = await prisma.mockup.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ mockups })
  } catch (error) {
    console.error('Error fetching mockups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mockups' },
      { status: 500 }
    )
  }
}


