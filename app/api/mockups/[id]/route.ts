import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const mockup = await prisma.mockup.findUnique({
      where: { id: params.id },
    })

    if (!mockup) {
      return NextResponse.json({ error: 'Mockup not found' }, { status: 404 })
    }

    // Delete image file
    try {
      const imagePath = join(process.cwd(), 'public', mockup.imageUrl)
      await unlink(imagePath)
    } catch (error) {
      console.error('Error deleting mockup file:', error)
      // Continue even if file deletion fails
    }

    // Delete mockup (cascade will delete related jobs)
    await prisma.mockup.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting mockup:', error)
    return NextResponse.json(
      { error: 'Failed to delete mockup' },
      { status: 500 }
    )
  }
}


