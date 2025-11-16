'use client'

import { useState, useMemo } from 'react'

interface PreviewItem {
  id: string
  outputUrl: string
  designName: string
  mockupName?: string
}

interface PreviewGalleryProps {
  items: PreviewItem[]
}

export default function PreviewGallery({ items }: PreviewGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  // Group items by design name
  const groupedByDesign = useMemo(() => {
    const groups = new Map<string, PreviewItem[]>()
    items.forEach(item => {
      const designName = item.designName
      if (!groups.has(designName)) {
        groups.set(designName, [])
      }
      groups.get(designName)!.push(item)
    })
    return Array.from(groups.entries())
  }, [items])

  if (items.length === 0) return null

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">
            Preview Results
            <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {items.length} outputs
            </span>
          </h3>
        </div>
        
        <div className="space-y-8">
          {groupedByDesign.map(([designName, designItems]) => (
            <div key={designName} className="space-y-3">
              {/* Design Header */}
              <div className="flex items-center space-x-3 pb-2 border-b-2 border-gray-200">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{designName}</h4>
                  <p className="text-xs text-gray-500">
                    {designItems.length} mockup{designItems.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Mockups Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {designItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
                    onClick={() => setSelectedImage(item.outputUrl)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={item.outputUrl}
                        alt={`${item.mockupName} - ${item.designName}`}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-white">
                      {item.mockupName && (
                        <p className="text-xs text-blue-600 font-semibold truncate text-center">
                          {item.mockupName}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full-size image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
              <img
                src={selectedImage}
                alt="Preview"
                className="w-full h-auto max-h-[90vh] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <p className="text-white text-center mt-4 text-sm">
              Click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  )
}

