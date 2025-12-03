import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import * as path from 'path'
import { existsSync } from 'fs'
import { getPublicFilePath, getPublicPath } from '@/lib/file-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    // Handle both sync and async params (Next.js 14 vs 15+)
    const resolvedParams = await Promise.resolve(params)
    
    // Join path segments to get the full file path
    const filePath = resolvedParams.path.join('/')
    
    console.log(`[GET /api/uploads] Requested path: ${filePath}`)
    
    // Security: Only allow files from uploads or outputs directory
    if (!filePath.startsWith('mockups/') && !filePath.startsWith('designs/') && !filePath.startsWith('outputs/')) {
      console.error(`[GET /api/uploads] Invalid path: ${filePath}`)
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 })
    }

    // Construct full file path using helper function
    // outputs/... goes to public/outputs, others go to public/uploads
    let fullPath: string
    if (filePath.startsWith('outputs/')) {
      fullPath = getPublicFilePath(filePath)
    } else {
      fullPath = getPublicFilePath(`uploads/${filePath}`)
    }

    console.log(`[GET /api/uploads] Looking for file at: ${fullPath}`)
    console.log(`[GET /api/uploads] process.cwd(): ${process.cwd()}`)
    console.log(`[GET /api/uploads] NODE_ENV: ${process.env.NODE_ENV}`)

    // Check if file exists
    if (!existsSync(fullPath)) {
      // Try alternative paths in production
      const alternativePaths: string[] = []
      
      // Try with direct public path
      const directPath = path.join(process.cwd(), 'public', 'uploads', filePath)
      if (directPath !== fullPath) {
        alternativePaths.push(directPath)
      }
      
      // Try with standalone mode paths
      const standalonePaths = [
        path.join(process.cwd(), '..', 'public', 'uploads', filePath),
        path.join(process.cwd(), '../..', 'public', 'uploads', filePath),
      ]
      alternativePaths.push(...standalonePaths)
      
      // Check if any alternative path exists
      let foundPath: string | null = null
      for (const altPath of alternativePaths) {
        if (existsSync(altPath)) {
          foundPath = altPath
          console.log(`[GET /api/uploads] Found file at alternative path: ${altPath}`)
          break
        }
      }
      
      if (!foundPath) {
        console.error(`[GET /api/uploads] File not found at: ${fullPath}`)
        console.error(`[GET /api/uploads] Tried alternative paths:`, alternativePaths)
      return NextResponse.json({ 
        error: 'File not found',
        requestedPath: filePath,
        checkedPath: fullPath,
          alternativePaths: alternativePaths,
          cwd: process.cwd(),
          publicPath: getPublicPath(),
      }, { status: 404 })
      }
      
      fullPath = foundPath
    }

    console.log(`[GET /api/uploads] Serving file: ${fullPath}`)

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
    console.error('[GET /api/uploads] Error serving file:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to serve file',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
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

