import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

export interface DesignArea {
  x: number
  y: number
  width: number
  height: number
  rotation?: number // Rotation in degrees
}

export async function compositeDesignOnMockup(
  mockupPath: string,
  designPath: string,
  designArea: DesignArea, // Normalized coordinates (0-1)
  outputPath: string
): Promise<void> {
  // Kiểm tra file tồn tại
  try {
    await fs.access(mockupPath)
  } catch {
    throw new Error(`Mockup file not found: ${mockupPath}`)
  }
  
  try {
    await fs.access(designPath)
  } catch {
    throw new Error(`Design file not found: ${designPath}`)
  }

  // Load mockup
  const mockup = sharp(mockupPath)
  const mockupMetadata = await mockup.metadata()
  
  if (!mockupMetadata.width || !mockupMetadata.height) {
    throw new Error('Invalid mockup image dimensions')
  }

  // Convert normalized coordinates (0-1) to actual pixel coordinates
  const scaledArea = {
    x: designArea.x * mockupMetadata.width,
    y: designArea.y * mockupMetadata.height,
    width: designArea.width * mockupMetadata.width,
    height: designArea.height * mockupMetadata.height,
  }

  // Load design
  const design = sharp(designPath)
  const designMetadata = await design.metadata()

  // Resize design to fit the design area
  let processedDesign = design
    .resize(Math.round(scaledArea.width), Math.round(scaledArea.height), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })

  // Apply rotation if specified
  if (designArea.rotation && designArea.rotation !== 0) {
    processedDesign = processedDesign.rotate(designArea.rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
  }

  const resizedDesign = await processedDesign.toBuffer()

  // Calculate composite position (accounting for rotation)
  // For rotation, we need to center the rotated design in the area
  const compositeLeft = Math.round(scaledArea.x)
  const compositeTop = Math.round(scaledArea.y)

  // Composite design onto mockup
  await mockup
    .composite([
      {
        input: resizedDesign,
        left: compositeLeft,
        top: compositeTop
      }
    ])
    .toFile(outputPath)
}

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath)
  } catch {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

