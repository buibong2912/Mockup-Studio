'use client'

import { useState } from 'react'

interface Mockup {
  id: string
  name: string
  imageUrl: string
  designAreaX: number
  designAreaY: number
  designAreaWidth: number
  designAreaHeight: number
}

interface MultiMockupSelectorProps {
  mockups: Mockup[]
  selectedMockupIds: string[]
  onSelectionChange: (selectedIds: string[]) => void
}

export default function MultiMockupSelector({
  mockups,
  selectedMockupIds,
  onSelectionChange,
}: MultiMockupSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMockup = (mockupId: string) => {
    if (selectedMockupIds.includes(mockupId)) {
      onSelectionChange(selectedMockupIds.filter(id => id !== mockupId))
    } else {
      onSelectionChange([...selectedMockupIds, mockupId])
    }
  }

  const selectAll = () => {
    onSelectionChange(mockups.map(m => m.id))
  }

  const deselectAll = () => {
    onSelectionChange([])
  }

  const selectedMockups = mockups.filter(m => selectedMockupIds.includes(m.id))

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Select Mockups</h3>
            <p className="text-sm text-gray-600">
              Choose multiple mockups to generate product sets
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {selectedMockupIds.length > 0 && (
              <>
                <button
                  onClick={deselectAll}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={selectAll}
                  className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors"
                >
                  Select All
                </button>
              </>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              {isOpen ? 'Hide' : 'Choose'} ({selectedMockupIds.length})
            </button>
          </div>
        </div>

        {/* Selected Mockups Preview */}
        {selectedMockupIds.length > 0 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800">
                {selectedMockupIds.length} mockup{selectedMockupIds.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-xs text-gray-600">
                {selectedMockupIds.length} × designs = {selectedMockupIds.length} combinations per design
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedMockups.map(mockup => (
                <div
                  key={mockup.id}
                  className="flex items-center space-x-2 bg-white rounded-lg px-3 py-1.5 border-2 border-blue-300"
                >
                  <div className="w-8 h-8 rounded overflow-hidden border border-gray-200">
                    <img
                      src={mockup.imageUrl}
                      alt={mockup.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{mockup.name}</span>
                  <button
                    onClick={() => toggleMockup(mockup.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mockup Grid */}
        {isOpen && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            {mockups.map(mockup => {
              const isSelected = selectedMockupIds.includes(mockup.id)
              return (
                <div
                  key={mockup.id}
                  onClick={() => toggleMockup(mockup.id)}
                  className={`
                    relative p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="relative aspect-square mb-2 rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={mockup.imageUrl}
                      alt={mockup.name}
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <h4 className="text-xs font-semibold text-gray-800 text-center truncate">
                    {mockup.name}
                  </h4>
                </div>
              )
            })}
          </div>
        )}

        {mockups.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm">No mockups available. Upload mockups first.</p>
          </div>
        )}
      </div>
    </div>
  )
}


