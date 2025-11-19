'use client'

import { useState, useEffect } from 'react'
import MockupUpload from '@/components/MockupUpload'
import DesignAreaSelector from '@/components/DesignAreaSelector'
import BatchDesignUpload from '@/components/BatchDesignUpload'
import JobProcessor from '@/components/JobProcessor'
import MockupManager from '@/components/MockupManager'
import MultiMockupSelector from '@/components/MultiMockupSelector'

export default function Home() {
  const [mockups, setMockups] = useState<any[]>([])
  const [currentMockup, setCurrentMockup] = useState<any>(null)
  const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>([])
  const [areaSelectedMockupIds, setAreaSelectedMockupIds] = useState<string[]>([])
  const [selectedDesigns, setSelectedDesigns] = useState<any[]>([])
  const [designAreas, setDesignAreas] = useState<Record<string, { x: number; y: number; width: number; height: number; rotation: number }>>({})

  const normalizeMockupArea = (mockup: any) => ({
    x: mockup.designAreaX,
    y: mockup.designAreaY,
    width: mockup.designAreaWidth,
    height: mockup.designAreaHeight,
    rotation: mockup.designAreaRotation || 0,
  })

  const applyAreaToMockup = (mockup: any, area: { x: number; y: number; width: number; height: number; rotation: number }) => ({
    ...mockup,
    designAreaX: area.x,
    designAreaY: area.y,
    designAreaWidth: area.width,
    designAreaHeight: area.height,
    designAreaRotation: area.rotation,
  })
  const [previewDesign, setPreviewDesign] = useState<any>(null)
  const [applyAreaToSelection, setApplyAreaToSelection] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  const updateAreaSelection = (ids: string[]) => {
    setAreaSelectedMockupIds(ids)
    if (ids.length <= 1) {
      setApplyAreaToSelection(false)
    }
  }

  // Fetch all mockups on mount
  useEffect(() => {
    fetchMockups()
  }, [])

  const fetchMockups = async () => {
    try {
      const response = await fetch('/api/mockups')
      if (response.ok) {
        const data = await response.json()
        const newMockups = data.mockups
        const areaMap: Record<string, { x: number; y: number; width: number; height: number; rotation: number }> = {}
        newMockups.forEach((mockup: any) => {
          areaMap[mockup.id] = normalizeMockupArea(mockup)
        })
        
        // Preserve current mockup selection if it still exists
        setCurrentMockup((prevCurrent: any) => {
          if (prevCurrent) {
            // Find the updated version of current mockup in new list
            const updatedCurrent = newMockups.find((m: any) => m.id === prevCurrent.id)
            if (updatedCurrent) {
              return updatedCurrent
            }
          }
          // Auto-select first mockup only if no current mockup
          if (!prevCurrent && newMockups.length > 0) {
            const firstMockup = newMockups[0]
            // Also add to selectedMockupIds
            setSelectedMockupIds((prevIds) => {
              if (prevIds.length === 0) {
                return [firstMockup.id]
              }
              return prevIds
            })
            setAreaSelectedMockupIds((prevIds) => {
              if (prevIds.length === 0) {
                return [firstMockup.id]
              }
              return prevIds
            })
            return firstMockup
          }
          return prevCurrent
        })
        // Update mockups list and cached design areas
        setMockups(newMockups)
        setDesignAreas(areaMap)
        setAreaSelectedMockupIds((prev) => {
          const valid = prev.filter((id) => newMockups.some((m: any) => m.id === id))
          const next = valid.length > 0 ? valid : (newMockups.length > 0 ? [newMockups[0].id] : [])
          if (next.length <= 1) {
            setApplyAreaToSelection(false)
          }
          return next
        })
      }
    } catch (error) {
      console.error('Error fetching mockups:', error)
    }
  }

  const handleMockupUpload = (mockup: any) => {
    setMockups([mockup, ...mockups])
    setDesignAreas((prev) => ({
      ...prev,
      [mockup.id]: normalizeMockupArea(mockup),
    }))
    updateAreaSelection([mockup.id])
    setCurrentMockup(mockup)
    // Auto-select new mockup for multi-select
    if (!selectedMockupIds.includes(mockup.id)) {
      setSelectedMockupIds([...selectedMockupIds, mockup.id])
    }
    setActiveStep(2)
  }

  const handleSelectMockup = (mockup: any) => {
    // Load the mockup with its area data from the current mockups list
    // Use functional update to ensure we get the latest mockups list
    setMockups((prevMockups) => {
      const fullMockup = prevMockups.find(m => m.id === mockup.id) || mockup
      // Set current mockup immediately with the found mockup
      setCurrentMockup(fullMockup)
      return prevMockups
    })
    // Also add to selectedMockupIds if not already selected
    setSelectedMockupIds((prevIds) => {
      if (!prevIds.includes(mockup.id)) {
        return [...prevIds, mockup.id]
      }
      return prevIds
    })
    updateAreaSelection([mockup.id])
    setActiveStep(2)
  }

  const handleDeleteMockup = async (mockupId: string) => {
    try {
      const response = await fetch(`/api/mockups/${mockupId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const updatedMockups = mockups.filter(m => m.id !== mockupId)
        setMockups(updatedMockups)
        setDesignAreas((prev) => {
          const { [mockupId]: _, ...rest } = prev
          return rest
        })
        setAreaSelectedMockupIds((prev) => {
          const filtered = prev.filter(id => id !== mockupId)
          const next = filtered.length > 0 ? filtered : (updatedMockups.length > 0 ? [updatedMockups[0].id] : [])
          if (next.length <= 1) {
            setApplyAreaToSelection(false)
          }
          return next
        })
        
        // Remove from selectedMockupIds
        const updatedSelectedIds = selectedMockupIds.filter(id => id !== mockupId)
        setSelectedMockupIds(updatedSelectedIds)
        
        if (currentMockup?.id === mockupId) {
          if (updatedMockups.length > 0) {
            const firstRemaining = updatedMockups[0]
            setCurrentMockup(firstRemaining)
            // Auto-select first remaining mockup if not already selected
            if (!updatedSelectedIds.includes(firstRemaining.id)) {
              setSelectedMockupIds([...updatedSelectedIds, firstRemaining.id])
            }
          } else {
            setCurrentMockup(null)
            setSelectedMockupIds([])
            setActiveStep(1)
          }
        }
      } else {
        alert('Failed to delete mockup')
      }
    } catch (error) {
      console.error('Error deleting mockup:', error)
      alert('Failed to delete mockup')
    }
  }

  const handleCreateNew = () => {
    setActiveStep(1)
  }

  const handleDesignAreaChange = async (area: { x: number; y: number; width: number; height: number; rotation: number }, imageSize: { width: number; height: number }) => {
    if (!currentMockup || imageSize.width === 0 || imageSize.height === 0) return

    // Normalize coordinates (0-1) before saving
    const normalizedArea = {
      x: area.x / imageSize.width,
      y: area.y / imageSize.height,
      width: area.width / imageSize.width,
      height: area.height / imageSize.height,
      rotation: area.rotation || 0,
    }

    const shouldApplyToSelection =
      applyAreaToSelection &&
      areaSelectedMockupIds.length > 1 &&
      areaSelectedMockupIds.includes(currentMockup.id)

    const targetMockupIds = shouldApplyToSelection ? areaSelectedMockupIds : [currentMockup.id]

    // Update local caches immediately for better UX
    setDesignAreas((prev) => {
      const updated = { ...prev }
      targetMockupIds.forEach((id) => {
        updated[id] = { ...normalizedArea }
      })
      return updated
    })

    setMockups((prev) =>
      prev.map((mockup) =>
        targetMockupIds.includes(mockup.id)
          ? applyAreaToMockup(mockup, normalizedArea)
          : mockup
      )
    )

    setCurrentMockup((prev: any) =>
      prev && targetMockupIds.includes(prev.id)
        ? applyAreaToMockup(prev, normalizedArea)
        : prev
    )

    try {
      // If multiple mockups are selected, update all of them
      if (targetMockupIds.length > 1) {
        const response = await fetch('/api/mockups/batch-update-area', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mockupIds: targetMockupIds,
            area: normalizedArea,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // Update all mockups in the list
          const updatedMockupsMap = new Map(data.mockups.map((m: any) => [m.id, m]))
          setMockups((prev) => prev.map(m => updatedMockupsMap.get(m.id) || m))
          setDesignAreas((prev) => {
            const updated = { ...prev }
            data.mockups.forEach((m: any) => {
              updated[m.id] = normalizeMockupArea(m)
            })
            return updated
          })
          // Update current mockup
          if (updatedMockupsMap.has(currentMockup.id)) {
            setCurrentMockup(updatedMockupsMap.get(currentMockup.id))
          }
        }
      } else {
        // Update single mockup
        const response = await fetch(`/api/mockups/${currentMockup.id}/update-design-area`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(normalizedArea),
        })

        if (response.ok) {
          const data = await response.json()
          setCurrentMockup(data.mockup)
          // Update mockup in the list
          setMockups((prev) => prev.map(m => m.id === data.mockup.id ? data.mockup : m))
          setDesignAreas((prev) => ({
            ...prev,
            [data.mockup.id]: normalizeMockupArea(data.mockup),
          }))
        }
      }
    } catch (error) {
      console.error('Error updating design area:', error)
    }
  }

  const handleDesignsUpload = (designs: any[]) => {
    setSelectedDesigns(designs)
    if (designs.length > 0 && currentMockup) {
      setActiveStep(4)
    }
  }

  const handleJobComplete = (jobId: string) => {
    console.log('Job completed:', jobId)
  }

  const steps = [
    { id: 1, title: 'Upload Mockup', description: 'Chọn mockup của bạn' },
    { id: 2, title: 'Define Area', description: 'Xác định vùng design' },
    { id: 3, title: 'Upload Designs', description: 'Tải lên designs' },
    { id: 4, title: 'Process', description: 'Xử lý batch job' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-bg rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Mockup Design Tool
                </h1>
                <p className="text-sm text-gray-500">Batch compositing made easy</p>
              </div>
            </div>
            <div className="w-80">
              <MockupManager
                mockups={mockups}
                currentMockup={currentMockup}
                onSelectMockup={handleSelectMockup}
                onDeleteMockup={handleDeleteMockup}
                onCreateNew={handleCreateNew}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar - Steps Navigation */}
        <aside className="w-80 bg-white/60 backdrop-blur-lg border-r border-gray-200 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Workflow Steps</h2>
          <div className="space-y-3">
            {steps.map((step, index) => {
              const isActive = activeStep === step.id
              const isCompleted = activeStep > step.id
              const isDisabled = step.id === 2 && !currentMockup || 
                               step.id === 4 && (selectedMockupIds.length === 0 || selectedDesigns.length === 0)

              return (
                <div
                  key={step.id}
                  className={`relative p-4 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                      : isCompleted
                      ? 'bg-green-50 text-green-700 border-2 border-green-200'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 cursor-pointer border-2 border-gray-200'
                  }`}
                  onClick={() => !isDisabled && setActiveStep(step.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      isActive
                        ? 'bg-white text-blue-600'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${isActive ? 'text-white' : ''}`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs mt-1 ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute left-6 top-12 w-0.5 h-8 ${
                      isCompleted ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Status Info */}
          {currentMockup && (
            <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Current Status</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mockup:</span>
                  <span className="font-medium text-green-600">✓ Loaded</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Designs:</span>
                  <span className="font-medium">{selectedDesigns.length} files</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Step 1: Upload Mockup */}
            {activeStep === 1 && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Upload Mockup</h2>
                    <p className="text-gray-500">Chọn file mockup của bạn (PNG/JPG). Bạn có thể tạo nhiều mockups.</p>
                  </div>
                </div>
                {mockups.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                    <p className="text-sm text-blue-800">
                      💡 Bạn đã có <strong>{mockups.length}</strong> mockup{mockups.length !== 1 ? 's' : ''}. 
                      Upload thêm mockup mới hoặc chọn từ danh sách ở header.
                    </p>
                  </div>
                )}
                <MockupUpload onUploadComplete={handleMockupUpload} />
              </div>
            )}

            {/* Step 2: Define Design Area */}
            {activeStep === 2 && currentMockup && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">2</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">Define Design Area</h2>
                    <p className="text-gray-500">Kéo và resize khung để xác định vùng design. Upload design để xem preview real-time.</p>
                    {areaSelectedMockupIds.length > 1 && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          💡 <strong>{areaSelectedMockupIds.length} mockups</strong> đã được chọn. Thay đổi area sẽ áp dụng cho tất cả mockups đã chọn.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Mockup Selector for Area Definition */}
                {mockups.length > 1 && (
                  <div className="mb-6">
                    <MultiMockupSelector
                      mockups={mockups}
                      selectedMockupIds={areaSelectedMockupIds}
                      onSelectionChange={(ids) => {
                        const nextSelection =
                          ids.length === 0 && currentMockup ? [currentMockup.id] : ids
                        updateAreaSelection(nextSelection)
                        // If current mockup is deselected, switch to first selected
                        if (nextSelection.length > 0 && (!currentMockup || !nextSelection.includes(currentMockup.id))) {
                          const newCurrent = mockups.find(m => nextSelection.includes(m.id))
                          if (newCurrent) {
                            setCurrentMockup(newCurrent)
                          }
                        }
                      }}
                    />
                  </div>
                )}

                {areaSelectedMockupIds.length > 1 && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="text-sm text-blue-900">
                      Áp dụng thay đổi cho <strong>{areaSelectedMockupIds.length}</strong> mockups được chọn
                    </div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-blue-900">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-blue-300 rounded focus:ring-blue-500"
                        checked={applyAreaToSelection}
                        onChange={(e) => setApplyAreaToSelection(e.target.checked)}
                      />
                      <span>Batch update</span>
                    </label>
                  </div>
                )}

                {/* Mockup Switcher - Quick switch between selected mockups */}
                {areaSelectedMockupIds.length > 1 && (
                  <div className="mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-800">Switch Mockup View</h3>
                      <span className="text-xs text-gray-600">
                        {areaSelectedMockupIds.findIndex(id => id === currentMockup?.id) + 1} / {areaSelectedMockupIds.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {areaSelectedMockupIds.map((mockupId) => {
                        const mockup = mockups.find(m => m.id === mockupId)
                        if (!mockup) return null
                        const isActive = currentMockup?.id === mockupId
                        return (
                          <button
                            key={mockupId}
                            onClick={() => {
                              // Ensure we use the latest mockup data from the list
                              const latestMockup = mockups.find(m => m.id === mockupId) || mockup
                              setCurrentMockup(latestMockup)
                            }}
                            className={`
                              px-4 py-2 rounded-lg border-2 transition-all text-sm font-medium
                              ${isActive
                                ? 'bg-purple-500 text-white border-purple-600 shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-purple-400 hover:bg-purple-50'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded overflow-hidden border-2 ${isActive ? 'border-white' : 'border-gray-200'}`}>
                                <img
                                  src={mockup.imageUrl}
                                  alt={mockup.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span>{mockup.name}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Preview Design Selector */}
                <div className="mb-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800 mb-1">Select Design for Preview</h3>
                      <p className="text-xs text-gray-600">Choose a design to see real-time preview while adjusting the area</p>
                    </div>
                    {previewDesign && (
                      <button
                        onClick={() => setPreviewDesign(null)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-white rounded-lg border border-gray-300 transition-colors"
                      >
                        Clear Preview
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Quick Upload for Preview */}
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          try {
                            const formData = new FormData()
                            formData.append('files', file)

                            const response = await fetch('/api/designs/upload', {
                              method: 'POST',
                              body: formData,
                            })

                            if (response.ok) {
                              const data = await response.json()
                              if (data.designs && data.designs.length > 0) {
                                const newDesign = data.designs[0]
                                setPreviewDesign(newDesign)
                                // Also add to selectedDesigns if not already there
                                if (!selectedDesigns.find(d => d.id === newDesign.id)) {
                                  setSelectedDesigns([...selectedDesigns, newDesign])
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error uploading preview design:', error)
                          }
                        }}
                      />
                      <div className="px-4 py-2 bg-white rounded-lg border-2 border-dashed border-blue-300 hover:border-blue-400 transition-colors text-center">
                        <span className="text-sm text-blue-600 font-medium">📤 Quick Upload for Preview</span>
                      </div>
                    </label>

                    {/* Select from uploaded designs */}
                    {selectedDesigns.length > 0 && (
                      <select
                        value={previewDesign?.id || ''}
                        onChange={(e) => {
                          const design = selectedDesigns.find(d => d.id === e.target.value)
                          setPreviewDesign(design || null)
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border-2 border-blue-300 bg-white text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Or Select from Uploaded --</option>
                        {selectedDesigns.map(design => (
                          <option key={design.id} value={design.id}>
                            {design.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedDesigns.length === 0 && !previewDesign && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        💡 Tip: Upload a design above to see real-time preview, or upload all designs in Step 3
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300">
                  {currentMockup && (
                    <DesignAreaSelector
                      key={currentMockup.id}
                      mockup={designAreas[currentMockup.id]
                        ? {
                            ...currentMockup,
                            designAreaX: designAreas[currentMockup.id].x,
                            designAreaY: designAreas[currentMockup.id].y,
                            designAreaWidth: designAreas[currentMockup.id].width,
                            designAreaHeight: designAreas[currentMockup.id].height,
                            designAreaRotation: designAreas[currentMockup.id].rotation,
                          }
                        : currentMockup
                      }
                      onAreaChange={handleDesignAreaChange}
                      previewDesign={previewDesign}
                    />
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    Next: Upload Designs →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Designs */}
            {activeStep === 3 && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">3</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Upload Designs (Batch)</h2>
                    <p className="text-gray-500">Tải lên nhiều file design cùng lúc (PNG với nền trong suốt)</p>
                  </div>
                </div>
                <BatchDesignUpload onUploadComplete={handleDesignsUpload} />
                {selectedDesigns.length > 0 && currentMockup && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setActiveStep(4)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                    >
                      Next: Process Job →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Process Job */}
            {activeStep === 4 && selectedDesigns.length > 0 && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 gradient-bg rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">4</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Process Batch Job</h2>
                    <p className="text-gray-500">Chọn mockups và xử lý để tạo bộ sản phẩm</p>
                  </div>
                </div>

                {/* Multi Mockup Selector */}
                <div className="mb-6">
                  <MultiMockupSelector
                    mockups={mockups}
                    selectedMockupIds={selectedMockupIds}
                    onSelectionChange={setSelectedMockupIds}
                  />
                </div>

                {/* Job Info */}
                {selectedMockupIds.length > 0 && selectedDesigns.length > 0 && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-800 mb-1">Job Summary</h3>
                        <p className="text-sm text-gray-600">
                          {selectedMockupIds.length} mockup{selectedMockupIds.length !== 1 ? 's' : ''} × {selectedDesigns.length} design{selectedDesigns.length !== 1 ? 's' : ''} = <strong className="text-purple-600">{selectedMockupIds.length * selectedDesigns.length} combinations</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {selectedMockupIds.length * selectedDesigns.length}
                        </div>
                        <div className="text-xs text-gray-500">Total outputs</div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMockupIds.length === 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Please select at least one mockup above to proceed
                    </p>
                  </div>
                )}

                <JobProcessor
                  mockupIds={selectedMockupIds}
                  designIds={selectedDesigns.map(d => d.id)}
                  onJobComplete={handleJobComplete}
                />
              </div>
            )}

            {/* Empty State */}
            {activeStep === 2 && !currentMockup && (
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 border border-gray-200 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Mockup Uploaded</h3>
                <p className="text-gray-500 mb-6">Please upload a mockup first</p>
                <button
                  onClick={() => setActiveStep(1)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Go to Step 1
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

