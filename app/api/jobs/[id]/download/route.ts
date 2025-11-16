import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import JSZip from 'jszip'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        jobDesigns: {
          include: {
            mockup: true,
            design: true
          },
          where: {
            status: 'completed'
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.jobDesigns.length === 0) {
      return NextResponse.json(
        { error: 'No completed designs to download' },
        { status: 400 }
      )
    }

    const zip = new JSZip()

    // Group by mockup for better organization
    const mockupGroups = new Map<string, typeof job.jobDesigns>()
    for (const jobDesign of job.jobDesigns) {
      if (jobDesign.outputUrl) {
        const mockupName = jobDesign.mockup.name
        if (!mockupGroups.has(mockupName)) {
          mockupGroups.set(mockupName, [])
        }
        mockupGroups.get(mockupName)!.push(jobDesign)
      }
    }

    for (const [mockupName, designs] of mockupGroups) {
      for (const jobDesign of designs) {
        if (jobDesign.outputUrl) {
          const filePath = join(process.cwd(), 'public', jobDesign.outputUrl)
          const fileBuffer = await readFile(filePath)
          const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50)
          const filename = `${sanitizeName(mockupName)}_${sanitizeName(jobDesign.design.name)}_${jobDesign.id}.png`
          zip.file(filename, fileBuffer)
        }
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

    // Get unique mockup names for filename
    const mockupNames = Array.from(mockupGroups.keys()).map(name => name.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 20))
    const zipFilename = mockupNames.length === 1 
      ? `${mockupNames[0]}_outputs.zip`
      : `multi_mockup_outputs_${Date.now()}.zip`

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
      },
    })
  } catch (error) {
    console.error('Error creating zip:', error)
    return NextResponse.json(
      { error: 'Failed to create zip file' },
      { status: 500 }
    )
  }
}

