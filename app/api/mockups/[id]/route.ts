import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const mockupId = resolvedParams.id
    
    console.log(`[DELETE /api/mockups/${mockupId}] Starting deletion...`)
    
    const mockup = await prisma.mockup.findUnique({
      where: { id: mockupId },
    })

    if (!mockup) {
      console.log(`[DELETE /api/mockups/${mockupId}] Mockup not found`)
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 })
    }

    console.log(`[DELETE /api/mockups/${mockupId}] Found mockup:`, mockup.name)

    // Delete image file
    try {
      const imagePath = join(process.cwd(), 'public', mockup.imageUrl)
      await unlink(imagePath)
      console.log(`[DELETE /api/mockups/${mockupId}] File deleted: ${imagePath}`)
    } catch (error) {
      console.error(`[DELETE /api/mockups/${mockupId}] Error deleting file:`, error)
      // Continue even if file deletion fails
    }

    // Delete mockup (cascade will delete related jobs)
    await prisma.mockup.delete({
      where: { id: mockupId }
    })

    console.log(`[DELETE /api/mockups/${mockupId}] Mockup deleted successfully`)

    return NextResponse.json({ success: true }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('[DELETE /api/mockups] Error deleting mockup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to delete mockup',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}


