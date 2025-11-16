'use client'

import { useEffect, useRef, useState } from 'react'

interface PreviewCanvasProps {
  mockupUrl: string
  designUrl: string | null
  designArea: {
    x: number
    y: number
    width: number
    height: number
  }
  imageSize: {
    width: number
    height: number
  }
}

export default function PreviewCanvas({
  mockupUrl,
  designUrl,
  designArea,
  imageSize,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Cache images to avoid reloading
  const mockupImgRef = useRef<HTMLImageElement | null>(null)
  const designImgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !designUrl || imageSize.width === 0 || imageSize.height === 0) {
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = imageSize.width
    canvas.height = imageSize.height

    const drawPreview = () => {
      if (!mockupImgRef.current || !designImgRef.current) return

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw mockup
      ctx.drawImage(mockupImgRef.current, 0, 0, canvas.width, canvas.height)

      // Draw design on top
      if (designImgRef.current.complete && designImgRef.current.naturalWidth > 0) {
        const designX = Math.round(designArea.x)
        const designY = Math.round(designArea.y)
        const designWidth = Math.round(designArea.width)
        const designHeight = Math.round(designArea.height)

        // Resize design to fit the area while maintaining aspect ratio
        const designAspect = designImgRef.current.naturalWidth / designImgRef.current.naturalHeight
        const areaAspect = designWidth / designHeight

        let drawWidth = designWidth
        let drawHeight = designHeight
        let drawX = designX
        let drawY = designY

        if (designAspect > areaAspect) {
          // Design is wider - fit to width
          drawHeight = designWidth / designAspect
          drawY = designY + (designHeight - drawHeight) / 2
        } else {
          // Design is taller - fit to height
          drawWidth = designHeight * designAspect
          drawX = designX + (designWidth - drawWidth) / 2
        }

        ctx.drawImage(designImgRef.current, drawX, drawY, drawWidth, drawHeight)
      }
    }

    // Load mockup image (only once)
    if (!mockupImgRef.current) {
      setIsLoading(true)
      const mockupImg = new Image()
      mockupImg.crossOrigin = 'anonymous'
      mockupImg.onload = () => {
        mockupImgRef.current = mockupImg
        if (designImgRef.current?.complete) {
          drawPreview()
          setIsLoading(false)
        }
      }
      mockupImg.onerror = () => {
        console.error('Failed to load mockup image')
        setIsLoading(false)
      }
      mockupImg.src = mockupUrl
    }

    // Load design image
    if (!designImgRef.current || designImgRef.current.src !== designUrl) {
      setIsLoading(true)
      const designImg = new Image()
      designImg.crossOrigin = 'anonymous'
      designImg.onload = () => {
        designImgRef.current = designImg
        if (mockupImgRef.current?.complete) {
          drawPreview()
          setIsLoading(false)
        }
      }
      designImg.onerror = () => {
        console.error('Failed to load design image')
        setIsLoading(false)
      }
      designImg.src = designUrl
    }

    // Redraw when area changes (if images are already loaded)
    if (mockupImgRef.current?.complete && designImgRef.current?.complete) {
      drawPreview()
    }
  }, [mockupUrl, designUrl, designArea, imageSize])

  if (!designUrl) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Upload a design to see preview</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-xl border-2 border-gray-300 shadow-lg"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}

