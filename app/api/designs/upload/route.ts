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

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'designs')
    await ensureDirectoryExists(uploadDir)

    const designs = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Sanitize và rút ngắn tên file, thêm random string để tránh trùng
      const randomStr = Math.random().toString(36).substring(2, 8)
      const sanitized = sanitizeFilename(file.name, 120)
      const filename = `${Date.now()}-${randomStr}-${sanitized}`
      const filepath = join(uploadDir, filename)
      await writeFile(filepath, buffer)

      const imageUrl = `/uploads/designs/${filename}`

      const design = await prisma.design.create({
        data: {
          name: file.name.replace(/\.[^/.]+$/, ''),
          imageUrl,
        }
      })

      designs.push(design)
    }

    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error uploading designs:', error)
    return NextResponse.json(
      { error: 'Failed to upload designs' },
      { status: 500 }
    )
  }
}

