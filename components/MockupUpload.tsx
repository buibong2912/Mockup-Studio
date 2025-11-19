'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface MockupUploadProps {
  onUploadComplete: (mockups: any[]) => void
}

export default function MockupUpload({ onUploadComplete }: MockupUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setUploadProgress({ current: 0, total: acceptedFiles.length })

    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/mockups/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setUploadProgress({ current: data.mockups.length, total: acceptedFiles.length })
      onUploadComplete(data.mockups)
    } catch (error) {
      console.error('Error uploading mockups:', error)
      alert('Failed to upload mockups')
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: true,
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive 
            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 scale-105 shadow-lg' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium mb-2">
              Uploading {uploadProgress.current} of {uploadProgress.total} mockup{uploadProgress.total !== 1 ? 's' : ''}...
            </p>
            {uploadProgress.total > 0 && (
              <div className="w-64 bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-2xl mb-4 flex items-center justify-center transition-all ${
              isDragActive ? 'bg-gradient-to-br from-blue-500 to-purple-500' : 'bg-gray-100'
            }`}>
              <svg className={`w-10 h-10 ${isDragActive ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className={`text-lg font-semibold mb-2 ${isDragActive ? 'text-blue-600' : 'text-gray-700'}`}>
              {isDragActive
                ? 'Drop the mockups here'
                : 'Drag & drop mockup images'}
            </p>
            <p className="text-sm text-gray-500 mb-4">or click to browse (multiple files supported)</p>
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-600">PNG or JPG</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

