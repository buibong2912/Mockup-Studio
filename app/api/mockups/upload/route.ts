import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { ensureDirectoryExists } from '@/lib/image-processor'
import { sanitizeFilename } from '@/lib/file-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string || file.name

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'mockups')
    await ensureDirectoryExists(uploadDir)

    // Sanitize và rút ngắn tên file để tránh lỗi path quá dài
    const filename = sanitizeFilename(file.name, 150)
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)

    const imageUrl = `/uploads/mockups/${filename}`

    // Get image dimensions for default design area
    const sharp = await import('sharp')
    const imageInfo = await sharp.default(buffer).metadata()
    const defaultWidth = imageInfo.width || 1000
    const defaultHeight = imageInfo.height || 1000
    
    // Save to database with normalized coordinates (default: center 20% area)
    const mockup = await prisma.mockup.create({
      data: {
        name,
        imageUrl,
        designAreaX: 0.4, // 40% from left
        designAreaY: 0.4, // 40% from top
        designAreaWidth: 0.2, // 20% width
        designAreaHeight: 0.2, // 20% height
        designAreaRotation: 0, // Default rotation
      }
    })

    return NextResponse.json({ mockup })
  } catch (error) {
    console.error('Error uploading mockup:', error)
    return NextResponse.json(
      { error: 'Failed to upload mockup' },
      { status: 500 }
    )
  }
}



