'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface BatchDesignUploadProps {
  onUploadComplete: (designs: any[]) => void
}

export default function BatchDesignUpload({ onUploadComplete }: BatchDesignUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedDesigns, setUploadedDesigns] = useState<any[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)

    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/designs/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const newDesigns = [...uploadedDesigns, ...data.designs]
      setUploadedDesigns(newDesigns)
      onUploadComplete(newDesigns)
    } catch (error) {
      console.error('Error uploading designs:', error)
      alert('Failed to upload designs')
    } finally {
      setUploading(false)
    }
  }, [uploadedDesigns, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
    },
    multiple: true,
  })

  const removeDesign = (id: string) => {
    const updated = uploadedDesigns.filter(d => d.id !== id)
    setUploadedDesigns(updated)
    onUploadComplete(updated)
  }

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive 
            ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50 hover:shadow-md'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Uploading {uploadedDesigns.length > 0 ? 'more' : ''} files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-2xl mb-4 flex items-center justify-center transition-all ${
              isDragActive ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gray-100'
            }`}>
              <svg className={`w-10 h-10 ${isDragActive ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className={`text-lg font-semibold mb-2 ${isDragActive ? 'text-green-600' : 'text-gray-700'}`}>
              {isDragActive
                ? 'Drop the design files here'
                : 'Drag & drop design files'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse multiple files</p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-600">PNG with transparent background</span>
            </div>
          </div>
        )}
      </div>

      {uploadedDesigns.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Uploaded Designs
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {uploadedDesigns.length}
              </span>
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {uploadedDesigns.map(design => (
              <div key={design.id} className="relative group bg-white rounded-xl p-3 border-2 border-gray-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden mb-2">
                  <img
                    src={design.imageUrl}
                    alt={design.name}
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeDesign(design.id)
                    }}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-gray-700 font-medium truncate text-center">{design.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

