import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { mockupIds, designIds } = await request.json()

    if (!mockupIds || !Array.isArray(mockupIds) || mockupIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one mockup ID is required' },
        { status: 400 }
      )
    }

    if (!designIds || !Array.isArray(designIds) || designIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one design ID is required' },
        { status: 400 }
      )
    }

    // Create all combinations: mockupIds × designIds
    const jobDesigns = []
    for (const mockupId of mockupIds) {
      for (const designId of designIds) {
        jobDesigns.push({
          mockupId,
          designId,
          status: 'pending',
        })
      }
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        status: 'pending',
        jobDesigns: {
          create: jobDesigns
        }
      },
      include: {
        jobDesigns: {
          include: {
            mockup: true,
            design: true
          }
        }
      }
    })

    // Trigger processing (async)
    processJob(job.id).catch(console.error)

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}

async function processJob(jobId: string) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing' }
    })

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobDesigns: {
          include: {
            mockup: true,
            design: true
          }
        }
      }
    })

    if (!job) return

    const { compositeDesignOnMockup, ensureDirectoryExists } = await import('@/lib/image-processor')
    const { join } = await import('path')

    const outputDir = join(process.cwd(), 'public', 'outputs', jobId)
    await ensureDirectoryExists(outputDir)

    const { fileExists } = await import('@/lib/file-utils')

    for (const jobDesign of job.jobDesigns) {
      try {
        await prisma.jobDesign.update({
          where: { id: jobDesign.id },
          data: { status: 'processing' }
        })

        const mockupPath = join(process.cwd(), 'public', jobDesign.mockup.imageUrl)
        const designPath = join(process.cwd(), 'public', jobDesign.design.imageUrl)

        // Kiểm tra file có tồn tại không
        if (!(await fileExists(mockupPath))) {
          throw new Error(`Mockup file not found: ${mockupPath}`)
        }
        if (!(await fileExists(designPath))) {
          throw new Error(`Design file not found: ${designPath}`)
        }

        // Sanitize tên file output để tránh lỗi path quá dài
        const sanitizeName = (name: string) => name.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50)
        const outputFilename = `${sanitizeName(jobDesign.mockup.name)}_${sanitizeName(jobDesign.design.name)}_${jobDesign.id}.png`
        const outputPath = join(outputDir, outputFilename)

        await compositeDesignOnMockup(
          mockupPath,
          designPath,
          {
            x: jobDesign.mockup.designAreaX,
            y: jobDesign.mockup.designAreaY,
            width: jobDesign.mockup.designAreaWidth,
            height: jobDesign.mockup.designAreaHeight,
          },
          outputPath
        )

        const outputUrl = `/outputs/${jobId}/${outputFilename}`

        await prisma.jobDesign.update({
          where: { id: jobDesign.id },
          data: {
            status: 'completed',
            outputUrl
          }
        })
      } catch (error) {
        console.error(`Error processing design ${jobDesign.id}:`, error)
        await prisma.jobDesign.update({
          where: { id: jobDesign.id },
          data: { status: 'failed' }
        })
      }
    }

    // Check if all designs are completed
    const updatedJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        jobDesigns: true
      }
    })

    if (updatedJob) {
      const allCompleted = updatedJob.jobDesigns.every(
        jd => jd.status === 'completed' || jd.status === 'failed'
      )

      if (allCompleted) {
        await prisma.job.update({
          where: { id: jobId },
          data: { status: 'completed' }
        })
      }
    }
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error)
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'failed' }
    })
  }
}

