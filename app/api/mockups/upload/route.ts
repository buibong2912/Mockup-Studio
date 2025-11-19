import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { ensureDirectoryExists } from '@/lib/image-processor'
import { sanitizeFilename } from '@/lib/file-utils'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
    }

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'mockups')
    await ensureDirectoryExists(uploadDir)

    const mockups = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize và rút ngắn tên file, thêm random string để tránh trùng
      const randomStr = Math.random().toString(36).substring(2, 8)
      const sanitized = sanitizeFilename(file.name, 120)
      const filename = `${Date.now()}-${randomStr}-${sanitized}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      const imageUrl = `/uploads/mockups/${filename}`

      // Get image dimensions for default design area
      const sharp = await import('sharp')
      const imageInfo = await sharp.default(buffer).metadata()
      const defaultWidth = imageInfo.width || 1000
      const defaultHeight = imageInfo.height || 1000
      
      const name = file.name.replace(/\.[^/.]+$/, '')
      
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

      console.log(`[POST /api/mockups/upload] Created mockup: ${mockup.id} - ${mockup.name}`)
      mockups.push(mockup)
    }

    return NextResponse.json({ mockups })
  } catch (error) {
    console.error('Error uploading mockups:', error)
    return NextResponse.json(
      { error: 'Failed to upload mockups' },
      { status: 500 }
    )
  }
}






