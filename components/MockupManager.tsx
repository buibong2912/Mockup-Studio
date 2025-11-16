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
  createdAt?: string
}

interface MockupManagerProps {
  mockups: Mockup[]
  currentMockup: Mockup | null
  onSelectMockup: (mockup: Mockup) => void
  onDeleteMockup: (mockupId: string) => void
  onCreateNew: () => void
}

export default function MockupManager({
  mockups,
  currentMockup,
  onSelectMockup,
  onDeleteMockup,
  onCreateNew,
}: MockupManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const handleDelete = (mockupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (mockups.length <= 1) {
      alert('Cannot delete the last mockup. Please create a new one first.')
      return
    }
    setShowDeleteConfirm(mockupId)
  }

  const confirmDelete = (mockupId: string) => {
    onDeleteMockup(mockupId)
    setShowDeleteConfirm(null)
    if (currentMockup?.id === mockupId && mockups.length > 1) {
      const otherMockup = mockups.find(m => m.id !== mockupId)
      if (otherMockup) {
        onSelectMockup(otherMockup)
      }
    }
  }

  return (
    <div className="relative">
      {/* Current Mockup Display */}
      <div
        className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {currentMockup ? (
              <>
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={currentMockup.imageUrl}
                    alt={currentMockup.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{currentMockup.name}</h3>
                  <p className="text-xs text-gray-500">
                    {mockups.length} mockup{mockups.length !== 1 ? 's' : ''} available
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <p className="text-sm text-gray-500">No mockup selected</p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateNew()
              }}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
            >
              + New
            </button>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mockup List Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">All Mockups</h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateNew()
                    setIsOpen(false)
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  + Create New
                </button>
              </div>
              <p className="text-xs text-gray-500">{mockups.length} mockup{mockups.length !== 1 ? 's' : ''} total</p>
            </div>

            <div className="p-2">
              {mockups.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No mockups yet</p>
                  <p className="text-xs mt-1">Create your first mockup to get started</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mockups.map((mockup) => {
                    const isSelected = currentMockup?.id === mockup.id
                    return (
                      <div
                        key={mockup.id}
                        className={`
                          relative p-3 rounded-lg border-2 transition-all cursor-pointer group
                          ${isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }
                        `}
                        onClick={() => {
                          onSelectMockup(mockup)
                          setIsOpen(false)
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200">
                            <img
                              src={mockup.imageUrl}
                              alt={mockup.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-800 truncate">{mockup.name}</h4>
                              {isSelected && (
                                <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Area: {Math.round(mockup.designAreaWidth * 100)}% × {Math.round(mockup.designAreaHeight * 100)}%
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDelete(mockup.id, e)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                            title="Delete mockup"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Mockup?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this mockup? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


