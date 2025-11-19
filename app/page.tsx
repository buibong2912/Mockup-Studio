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

  const handleMockupUpload = (uploadedMockups: any[]) => {
    if (uploadedMockups.length === 0) return

    // Add all new mockups to the list
    setMockups((prev) => [...uploadedMockups, ...prev])
    
    // Update design areas for all new mockups
    const newAreas: Record<string, { x: number; y: number; width: number; height: number; rotation: number }> = {}
    uploadedMockups.forEach((mockup) => {
      newAreas[mockup.id] = normalizeMockupArea(mockup)
    })
    setDesignAreas((prev) => ({
      ...prev,
      ...newAreas,
    }))
    
    // Set the first uploaded mockup as current
    const firstMockup = uploadedMockups[0]
    updateAreaSelection([firstMockup.id])
    setCurrentMockup(firstMockup)
    
    // Auto-select all new mockups for multi-select
    setSelectedMockupIds((prev) => {
      const newIds = uploadedMockups
        .map(m => m.id)
        .filter(id => !prev.includes(id))
      return [...newIds, ...prev]
    })
    
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header */}
      <header className="relative glass border-b border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-14 h-14 gradient-vibrant rounded-2xl flex items-center justify-center shadow-glow-purple transform hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-display text-gradient">
                  Print Studio
                </h1>
                <p className="text-sm text-gray-600 font-medium">Professional Mockup Design Tool</p>
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

      <div className="relative flex h-[calc(100vh-88px)]">
        {/* Sidebar - Steps Navigation */}
        <aside className="relative w-80 glass border-r border-white/20 p-6 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-display text-gray-800 mb-2">Workflow</h2>
            <p className="text-xs text-gray-500">Follow the steps to create your designs</p>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isActive = activeStep === step.id
              const isCompleted = activeStep > step.id
              const isDisabled = step.id === 2 && !currentMockup || 
                               step.id === 4 && (selectedMockupIds.length === 0 || selectedDesigns.length === 0)

              return (
                <div key={step.id} className="relative">
                  <div
                    className={`relative p-5 rounded-2xl transition-all duration-300 transform ${
                      isActive
                        ? 'gradient-vibrant text-white shadow-xl scale-105 z-10'
                        : isCompleted
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-700 border-2 border-emerald-200 shadow-md'
                        : isDisabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-2 border-gray-100'
                        : 'glass text-gray-700 hover:shadow-lg cursor-pointer border-2 border-white/50 hover:border-purple-200'
                    }`}
                    onClick={() => !isDisabled && setActiveStep(step.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
                        isActive
                          ? 'bg-white text-purple-600 shadow-glow'
                          : isCompleted
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className={`font-display text-base font-semibold mb-1 ${isActive ? 'text-white' : isCompleted ? 'text-emerald-800' : ''}`}>
                          {step.title}
                        </h3>
                        <p className={`text-xs ${isActive ? 'text-white/90' : isCompleted ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute left-9 top-20 w-1 h-6 transition-colors ${
                      isCompleted ? 'bg-gradient-to-b from-emerald-300 to-teal-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Status Info */}
          {currentMockup && (
            <div className="mt-8 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-md">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="text-sm font-display text-blue-900">Current Status</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Mockup:</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold flex items-center space-x-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Loaded</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Designs:</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    {selectedDesigns.length} files
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="relative flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {/* Step 1: Upload Mockup */}
            {activeStep === 1 && (
              <div className="card-modern p-10 animate-float">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 gradient-vibrant rounded-2xl flex items-center justify-center shadow-glow-purple">
                    <span className="text-white font-display text-2xl font-bold">1</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display text-gray-800 mb-2">Upload Mockup</h2>
                    <p className="text-gray-600 font-medium">Chọn file mockup của bạn (PNG/JPG). Bạn có thể tạo nhiều mockups.</p>
                  </div>
                </div>
                {mockups.length > 0 && (
                  <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-md">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-blue-900 font-medium">
                        Bạn đã có <strong className="text-blue-700">{mockups.length}</strong> mockup{mockups.length !== 1 ? 's' : ''}. 
                        Upload thêm mockup mới hoặc chọn từ danh sách ở header.
                      </p>
                    </div>
                  </div>
                )}
                <MockupUpload onUploadComplete={handleMockupUpload} />
              </div>
            )}

            {/* Step 2: Define Design Area */}
            {activeStep === 2 && currentMockup && (
              <div className="card-modern p-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 gradient-ocean rounded-2xl flex items-center justify-center shadow-glow">
                    <span className="text-white font-display text-2xl font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-display text-gray-800 mb-2">Define Design Area</h2>
                    <p className="text-gray-600 font-medium">Kéo và resize khung để xác định vùng design. Upload design để xem preview real-time.</p>
                    {areaSelectedMockupIds.length > 1 && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <p className="text-sm text-purple-900 font-medium">
                            <strong>{areaSelectedMockupIds.length} mockups</strong> đã được chọn. Thay đổi area sẽ áp dụng cho tất cả mockups đã chọn.
                          </p>
                        </div>
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
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setActiveStep(3)}
                    className="btn-primary flex items-center space-x-2 group"
                  >
                    <span>Next: Upload Designs</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Designs */}
            {activeStep === 3 && (
              <div className="card-modern p-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 gradient-sunset rounded-2xl flex items-center justify-center shadow-glow">
                    <span className="text-white font-display text-2xl font-bold">3</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display text-gray-800 mb-2">Upload Designs (Batch)</h2>
                    <p className="text-gray-600 font-medium">Tải lên nhiều file design cùng lúc (PNG với nền trong suốt)</p>
                  </div>
                </div>
                <BatchDesignUpload onUploadComplete={handleDesignsUpload} />
                {selectedDesigns.length > 0 && currentMockup && (
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setActiveStep(4)}
                      className="btn-secondary flex items-center space-x-2 group"
                    >
                      <span>Next: Process Job</span>
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Process Job */}
            {activeStep === 4 && selectedDesigns.length > 0 && (
              <div className="card-modern p-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="w-16 h-16 gradient-print rounded-2xl flex items-center justify-center shadow-glow">
                    <span className="text-white font-display text-2xl font-bold">4</span>
                  </div>
                  <div>
                    <h2 className="text-3xl font-display text-gray-800 mb-2">Process Batch Job</h2>
                    <p className="text-gray-600 font-medium">Chọn mockups và xử lý để tạo bộ sản phẩm</p>
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
                  <div className="mb-8 p-6 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-2xl text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-xl mb-2">Job Summary</h3>
                        <p className="text-purple-100 text-sm">
                          {selectedMockupIds.length} mockup{selectedMockupIds.length !== 1 ? 's' : ''} × {selectedDesigns.length} design{selectedDesigns.length !== 1 ? 's' : ''} = <strong className="text-white text-base">{selectedMockupIds.length * selectedDesigns.length} combinations</strong>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-display font-bold text-white mb-1">
                          {selectedMockupIds.length * selectedDesigns.length}
                        </div>
                        <div className="text-sm text-purple-100 font-medium">Total outputs</div>
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

