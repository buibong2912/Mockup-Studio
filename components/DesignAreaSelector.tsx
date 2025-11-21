'use client'

import { useState, useEffect, useRef } from 'react'
import PreviewCanvas from './PreviewCanvas'

interface DesignAreaSelectorProps {
  mockup: {
    id: string
    imageUrl: string
    designAreaX: number
    designAreaY: number
    designAreaWidth: number
    designAreaHeight: number
    designAreaRotation?: number
  }
  onAreaChange: (area: { x: number; y: number; width: number; height: number; rotation: number }, imageSize: { width: number; height: number }) => void
  previewDesign?: {
    id: string
    imageUrl: string
    name: string
  } | null
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null

export default function DesignAreaSelector({ mockup, onAreaChange, previewDesign }: DesignAreaSelectorProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [area, setArea] = useState({
    x: mockup.designAreaX,
    y: mockup.designAreaY,
    width: mockup.designAreaWidth,
    height: mockup.designAreaHeight,
    rotation: mockup.designAreaRotation || 0,
  })
  // Local input values (strings) to allow free typing
  const [inputValues, setInputValues] = useState({
    x: '',
    y: '',
    width: '',
    height: '',
    rotation: '',
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, areaX: 0, areaY: 0, areaW: 0, areaH: 0, rotation: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imageRef.current
    if (img) {
      if (img.complete) {
        setImageSize({ width: img.offsetWidth, height: img.offsetHeight })
      } else {
        img.onload = () => {
          setImageSize({ width: img.offsetWidth, height: img.offsetHeight })
        }
      }
    }
  }, [mockup.imageUrl])

  useEffect(() => {
    // Convert normalized coordinates (0-1) to pixels for display
    if (imageSize.width > 0 && imageSize.height > 0) {
      const newArea = {
        x: mockup.designAreaX * imageSize.width,
        y: mockup.designAreaY * imageSize.height,
        width: mockup.designAreaWidth * imageSize.width,
        height: mockup.designAreaHeight * imageSize.height,
        rotation: mockup.designAreaRotation || 0,
      }
      setArea(newArea)
      // Update input values when area changes from outside (e.g., dragging)
      setInputValues({
        x: Math.round(newArea.x).toString(),
        y: Math.round(newArea.y).toString(),
        width: Math.round(newArea.width).toString(),
        height: Math.round(newArea.height).toString(),
        rotation: Math.round(newArea.rotation).toString(),
      })
    }
  }, [mockup, imageSize])

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'rotate' | ResizeHandle) => {
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    if (type === 'drag') {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        areaX: area.x,
        areaY: area.y,
        areaW: area.width,
        areaH: area.height,
        rotation: area.rotation,
      })
    } else if (type === 'rotate') {
      setIsRotating(true)
      const centerX = area.x + area.width / 2
      const centerY = area.y + area.height / 2
      const startAngle = Math.atan2(
        (e.clientY - rect.top) - centerY,
        (e.clientX - rect.left) - centerX
      )
      setDragStart({
        x: startAngle,
        y: 0,
        areaX: area.x,
        areaY: area.y,
        areaW: area.width,
        areaH: area.height,
        rotation: area.rotation,
      })
    } else {
      setIsResizing(true)
      setResizeHandle(type)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        areaX: area.x,
        areaY: area.y,
        areaW: area.width,
        areaH: area.height,
        rotation: area.rotation,
      })
    }
  }

  const areaRef = useRef(area)
  const dragStartRef = useRef(dragStart)
  const imageSizeRef = useRef(imageSize)
  const isDraggingRef = useRef(isDragging)
  const isResizingRef = useRef(isResizing)
  const isRotatingRef = useRef(isRotating)
  const resizeHandleRef = useRef<ResizeHandle>(resizeHandle)
  const onAreaChangeRef = useRef(onAreaChange)
  const rafIdRef = useRef<number | null>(null)
  const lastCallbackTimeRef = useRef(0)
  const pendingAreaRef = useRef<{ area: typeof area; imageSize: typeof imageSize } | null>(null)

  useEffect(() => {
    onAreaChangeRef.current = onAreaChange
  }, [onAreaChange])

  useEffect(() => {
    areaRef.current = area
    dragStartRef.current = dragStart
    imageSizeRef.current = imageSize
    isDraggingRef.current = isDragging
    isResizingRef.current = isResizing
    isRotatingRef.current = isRotating
    resizeHandleRef.current = resizeHandle
  }, [area, dragStart, imageSize, isDragging, isResizing, isRotating, resizeHandle])

  // Throttled callback - only call onAreaChange every 50ms to avoid lag
  const triggerCallback = useRef(() => {
    if (pendingAreaRef.current) {
      onAreaChangeRef.current(pendingAreaRef.current.area, pendingAreaRef.current.imageSize)
      pendingAreaRef.current = null
    }
    lastCallbackTimeRef.current = Date.now()
  }).current

  const handleMouseMove = useRef((e: MouseEvent) => {
    if (!containerRef.current) return

    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }

    // Use requestAnimationFrame for smooth updates
    rafIdRef.current = requestAnimationFrame(() => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const currentArea = areaRef.current
      const currentDragStart = dragStartRef.current
      const currentImageSize = imageSizeRef.current
      const currentIsDragging = isDraggingRef.current
      const currentIsResizing = isResizingRef.current
      const currentIsRotating = isRotatingRef.current
      const currentResizeHandle = resizeHandleRef.current

      let updatedArea: typeof area | null = null

      if (currentIsDragging) {
        const newX = Math.max(0, Math.min(e.clientX - rect.left - currentDragStart.x + currentDragStart.areaX, currentImageSize.width - currentArea.width))
        const newY = Math.max(0, Math.min(e.clientY - rect.top - currentDragStart.y + currentDragStart.areaY, currentImageSize.height - currentArea.height))
        updatedArea = { ...currentArea, x: newX, y: newY }
      } else if (currentIsRotating) {
        const centerX = currentArea.x + currentArea.width / 2
        const centerY = currentArea.y + currentArea.height / 2
        const currentAngle = Math.atan2(
          e.clientY - rect.top - centerY,
          e.clientX - rect.left - centerX
        )
        const deltaAngle = currentAngle - currentDragStart.x
        const newRotation = (currentDragStart.rotation + (deltaAngle * 180 / Math.PI)) % 360
        const normalizedRotation = newRotation < 0 ? newRotation + 360 : newRotation
        updatedArea = { ...currentArea, rotation: normalizedRotation }
      } else if (currentIsResizing && currentResizeHandle) {
        const deltaX = (e.clientX - currentDragStart.x) * (rect.width / currentImageSize.width)
        const deltaY = (e.clientY - currentDragStart.y) * (rect.height / currentImageSize.height)

        let newArea = { ...currentArea }

        if (currentResizeHandle === 'se') {
          newArea.width = Math.max(50, Math.min(currentDragStart.areaW + deltaX, currentImageSize.width - currentDragStart.areaX))
          newArea.height = Math.max(50, Math.min(currentDragStart.areaH + deltaY, currentImageSize.height - currentDragStart.areaY))
        } else if (currentResizeHandle === 'sw') {
          const newWidth = Math.max(50, Math.min(currentDragStart.areaW - deltaX, currentDragStart.areaX + currentDragStart.areaW))
          const newX = currentDragStart.areaX + currentDragStart.areaW - newWidth
          newArea.x = Math.max(0, newX)
          newArea.width = newWidth
          newArea.height = Math.max(50, Math.min(currentDragStart.areaH + deltaY, currentImageSize.height - currentDragStart.areaY))
        } else if (currentResizeHandle === 'ne') {
          const newHeight = Math.max(50, Math.min(currentDragStart.areaH - deltaY, currentDragStart.areaY + currentDragStart.areaH))
          const newY = currentDragStart.areaY + currentDragStart.areaH - newHeight
          newArea.y = Math.max(0, newY)
          newArea.height = newHeight
          newArea.width = Math.max(50, Math.min(currentDragStart.areaW + deltaX, currentImageSize.width - currentDragStart.areaX))
        } else if (currentResizeHandle === 'nw') {
          const newWidth = Math.max(50, Math.min(currentDragStart.areaW - deltaX, currentDragStart.areaX + currentDragStart.areaW))
          const newHeight = Math.max(50, Math.min(currentDragStart.areaH - deltaY, currentDragStart.areaY + currentDragStart.areaH))
          const newX = currentDragStart.areaX + currentDragStart.areaW - newWidth
          const newY = currentDragStart.areaY + currentDragStart.areaH - newHeight
          newArea.x = Math.max(0, newX)
          newArea.y = Math.max(0, newY)
          newArea.width = newWidth
          newArea.height = newHeight
        }

        updatedArea = newArea
      }

      if (updatedArea) {
        // Update local state immediately for smooth UI
        setArea(updatedArea)
        
        // Update input values when dragging/resizing
        setInputValues({
          x: Math.round(updatedArea.x).toString(),
          y: Math.round(updatedArea.y).toString(),
          width: Math.round(updatedArea.width).toString(),
          height: Math.round(updatedArea.height).toString(),
          rotation: Math.round(updatedArea.rotation).toString(),
        })
        
        // Throttle callback - only call every 50ms
        pendingAreaRef.current = { area: updatedArea, imageSize: currentImageSize }
        const now = Date.now()
        if (now - lastCallbackTimeRef.current >= 50) {
          triggerCallback()
        }
      }

      rafIdRef.current = null
    })
  }).current

  const handleMouseUp = useRef(() => {
    // Cancel any pending animation frame
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    // Trigger final callback on mouse up
    if (pendingAreaRef.current) {
      triggerCallback()
    }

    setIsDragging(false)
    setIsResizing(false)
    setIsRotating(false)
    setResizeHandle(null)
  }).current

  useEffect(() => {
    if (isDragging || isResizing || isRotating) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        // Cleanup any pending animation frame
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      }
    }
  }, [isDragging, isResizing, isRotating, handleMouseMove, handleMouseUp])

  const scaleX = imageSize.width > 0 ? area.x / imageSize.width : 0
  const scaleY = imageSize.height > 0 ? area.y / imageSize.height : 0
  const scaleWidth = imageSize.width > 0 ? area.width / imageSize.width : 0
  const scaleHeight = imageSize.height > 0 ? area.height / imageSize.height : 0

  // Handle input change - just update local state, no validation yet
  const handleInputChange = (field: 'x' | 'y' | 'width' | 'height' | 'rotation', value: string) => {
    // Allow empty string and any input while typing
    setInputValues(prev => ({ ...prev, [field]: value }))
  }

  // Validate and apply input value when user finishes editing (blur or Enter)
  const handleInputBlur = (field: 'x' | 'y' | 'width' | 'height' | 'rotation') => {
    if (imageSize.width === 0 || imageSize.height === 0) return

    const valueStr = inputValues[field]
    const numValue = parseFloat(valueStr)
    
    // If empty or invalid, reset to current area value
    if (isNaN(numValue) || valueStr === '') {
      setInputValues(prev => ({
        ...prev,
        [field]: field === 'rotation' 
          ? Math.round(area.rotation).toString()
          : Math.round(area[field]).toString()
      }))
      return
    }

    let updatedArea = { ...area }

    if (field === 'x') {
      updatedArea.x = Math.max(0, Math.min(numValue, imageSize.width - area.width))
    } else if (field === 'y') {
      updatedArea.y = Math.max(0, Math.min(numValue, imageSize.height - area.height))
    } else if (field === 'width') {
      const newWidth = Math.max(50, Math.min(numValue, imageSize.width - area.x))
      updatedArea.width = newWidth
    } else if (field === 'height') {
      const newHeight = Math.max(50, Math.min(numValue, imageSize.height - area.y))
      updatedArea.height = newHeight
    } else if (field === 'rotation') {
      updatedArea.rotation = ((numValue % 360) + 360) % 360
    }

    setArea(updatedArea)
    onAreaChange(updatedArea, imageSize)
    
    // Update input value to the validated value
    setInputValues(prev => ({
      ...prev,
      [field]: field === 'rotation'
        ? Math.round(updatedArea.rotation).toString()
        : Math.round(updatedArea[field]).toString()
    }))
  }

  // Handle Enter key
  const handleInputKeyDown = (e: React.KeyboardEvent, field: 'x' | 'y' | 'width' | 'height' | 'rotation') => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      handleInputBlur(field)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Design Area Selector */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Define Design Area
          </h3>
          <div
            ref={containerRef}
            className="relative inline-block border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg"
          >
            <img
              ref={imageRef}
              src={mockup.imageUrl}
              alt="Mockup"
              className="max-w-full h-auto block"
              draggable={false}
            />
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
              style={{
                left: `${area.x}px`,
                top: `${area.y}px`,
                width: `${area.width}px`,
                height: `${area.height}px`,
                transform: `rotate(${area.rotation}deg)`,
                transformOrigin: 'center center',
              }}
              onMouseDown={(e) => handleMouseDown(e, 'drag')}
            >
              <div className="absolute inset-0 flex items-center justify-center text-blue-600 font-semibold text-sm pointer-events-none">
                Design Area
              </div>
              {/* Resize handles */}
              <div
                className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-nw-resize z-10"
                onMouseDown={(e) => handleMouseDown(e, 'nw')}
              />
              <div
                className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-ne-resize z-10"
                onMouseDown={(e) => handleMouseDown(e, 'ne')}
              />
              <div
                className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-sw-resize z-10"
                onMouseDown={(e) => handleMouseDown(e, 'sw')}
              />
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded cursor-se-resize z-10"
                onMouseDown={(e) => handleMouseDown(e, 'se')}
              />
              {/* Rotation handle - positioned above the area */}
              <div
                className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-purple-500 border-2 border-white rounded-full cursor-grab flex items-center justify-center z-10"
                style={{ transform: `translateX(-50%) rotate(${-area.rotation}deg)` }}
                onMouseDown={(e) => handleMouseDown(e, 'rotate')}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-3">Nhập kích thước thủ công</h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Position X */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Vị trí X (px)
                </label>
                <input
                  type="text"
                  value={inputValues.x}
                  onChange={(e) => handleInputChange('x', e.target.value)}
                  onBlur={() => handleInputBlur('x')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'x')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Position Y */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Vị trí Y (px)
                </label>
                <input
                  type="text"
                  value={inputValues.y}
                  onChange={(e) => handleInputChange('y', e.target.value)}
                  onBlur={() => handleInputBlur('y')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'y')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Width */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Chiều rộng (px)
                </label>
                <input
                  type="text"
                  value={inputValues.width}
                  onChange={(e) => handleInputChange('width', e.target.value)}
                  onBlur={() => handleInputBlur('width')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'width')}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Height */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Chiều cao (px)
                </label>
                <input
                  type="text"
                  value={inputValues.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  onBlur={() => handleInputBlur('height')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'height')}
                  placeholder="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Rotation */}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Góc xoay (độ)
                </label>
                <input
                  type="text"
                  value={inputValues.rotation}
                  onChange={(e) => handleInputChange('rotation', e.target.value)}
                  onBlur={() => handleInputBlur('rotation')}
                  onKeyDown={(e) => handleInputKeyDown(e, 'rotation')}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Position:</span> ({Math.round(area.x)}, {Math.round(area.y)})
                </div>
                <div>
                  <span className="font-medium text-gray-600">Size:</span> {Math.round(area.width)} × {Math.round(area.height)}
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Rotation:</span> {Math.round(area.rotation)}°
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Scale: X={scaleX.toFixed(2)}, Y={scaleY.toFixed(2)}, W={scaleWidth.toFixed(2)}, H={scaleHeight.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Preview */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Live Preview
            {previewDesign && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                {previewDesign.name}
              </span>
            )}
          </h3>
          <PreviewCanvas
            mockupUrl={mockup.imageUrl}
            designUrl={previewDesign?.imageUrl || null}
            designArea={area}
            imageSize={imageSize}
          />
        </div>
      </div>
    </div>
  )
}

