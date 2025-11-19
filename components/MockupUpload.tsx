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
          relative border-2 border-dashed rounded-3xl p-16 text-center cursor-pointer
          transition-all duration-300 overflow-hidden
          ${isDragActive 
            ? 'border-purple-500 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 scale-[1.02] shadow-xl shadow-purple-200' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-purple-50/30 hover:shadow-lg'
          }
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        {isDragActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 animate-shimmer"></div>
        )}
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <div className="relative flex flex-col items-center z-10">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 shadow-glow-purple"></div>
            <p className="text-lg font-display text-gray-800 mb-3">
              Uploading {uploadProgress.current} of {uploadProgress.total} mockup{uploadProgress.total !== 1 ? 's' : ''}...
            </p>
            {uploadProgress.total > 0 && (
              <div className="w-80 bg-gray-200 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                ></div>
              </div>
            )}
            <p className="text-sm text-gray-500">Please wait...</p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center z-10">
            <div className={`w-24 h-24 rounded-3xl mb-6 flex items-center justify-center transition-all transform ${
              isDragActive 
                ? 'gradient-vibrant shadow-glow-purple scale-110 rotate-6' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-purple-100 hover:to-pink-100'
            }`}>
              <svg className={`w-12 h-12 ${isDragActive ? 'text-white' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className={`text-2xl font-display mb-3 ${isDragActive ? 'text-purple-700' : 'text-gray-800'}`}>
              {isDragActive
                ? '✨ Drop the mockups here!'
                : 'Drag & drop mockup images'}
            </p>
            <p className="text-base text-gray-600 mb-6 font-medium">or click to browse (multiple files supported)</p>
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white rounded-xl shadow-md border-2 border-purple-100 hover:border-purple-300 transition-all">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-purple-700">PNG or JPG</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

