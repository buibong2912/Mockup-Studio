import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Handle both sync and async params (Next.js 14 vs 15+)
    const resolvedParams = await Promise.resolve(params)
    
    // Join path segments to get the full file path
    const filePath = resolvedParams.path.join('/')
    
    // Security: Only allow files from uploads or outputs directory
    if (!filePath.startsWith('mockups/') && !filePath.startsWith('designs/') && !filePath.startsWith('outputs/')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Construct full file path
    // outputs/... goes to public/outputs, others go to public/uploads
    let fullPath: string
    if (filePath.startsWith('outputs/')) {
      fullPath = join(process.cwd(), 'public', filePath)
    } else {
      fullPath = join(process.cwd(), 'public', 'uploads', filePath)
    }

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(fullPath)

    // Determine content type based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase()
    const contentType = getContentType(ext || '')

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    zip: 'application/zip',
  }
  return contentTypes[ext] || 'application/octet-stream'
}

