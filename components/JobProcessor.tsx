'use client'

import { useState, useEffect } from 'react'
import PreviewGallery from './PreviewGallery'

interface JobProcessorProps {
  mockupIds: string[]
  designIds: string[]
  onJobComplete: (jobId: string) => void
}

export default function JobProcessor({ mockupIds, designIds, onJobComplete }: JobProcessorProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'completed' | 'failed'>('idle')
  const [jobData, setJobData] = useState<any>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const createJob = async () => {
    if (!mockupIds || mockupIds.length === 0) {
      alert('Please select at least one mockup')
      return
    }
    if (!designIds || designIds.length === 0) {
      alert('Please upload at least one design')
      return
    }

    setStatus('creating')

    try {
      const response = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mockupIds, designIds }),
      })

      if (!response.ok) {
        throw new Error('Failed to create job')
      }

      const data = await response.json()
      setJobId(data.job.id)
      setStatus('processing')
      pollJobStatus(data.job.id)
    } catch (error) {
      console.error('Error creating job:', error)
      setStatus('failed')
      alert('Failed to create job')
    }
  }

  const pollJobStatus = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${id}/status`)
        if (!response.ok) return

        const data = await response.json()
        setJobData(data.job)

        if (data.job.status === 'completed') {
          clearInterval(interval)
          setStatus('completed')
          setDownloadUrl(`/api/jobs/${id}/download`)
          onJobComplete(id)
        } else if (data.job.status === 'failed') {
          clearInterval(interval)
          setStatus('failed')
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }, 1000)

    // Cleanup on unmount
    return () => clearInterval(interval)
  }

  useEffect(() => {
    if (jobId && status === 'processing') {
      pollJobStatus(jobId)
    }
  }, [jobId, status])

  const getProgress = () => {
    if (!jobData || !jobData.jobDesigns) return 0
    const completed = jobData.jobDesigns.filter((jd: any) => jd.status === 'completed').length
    return Math.round((completed / jobData.jobDesigns.length) * 100)
  }

  return (
    <div className="w-full space-y-6">
      <button
        onClick={createJob}
        disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
        className={`
          w-full py-4 px-6 rounded-2xl font-semibold text-lg
          transition-all duration-300 transform
          ${status === 'idle' || status === 'completed' || status === 'failed'
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-xl hover:scale-105 active:scale-95'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        {status === 'idle' && (
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Start Processing</span>
          </span>
        )}
        {status === 'creating' && (
          <span className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Creating Job...</span>
          </span>
        )}
        {status === 'processing' && (
          <span className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processing... {getProgress()}%</span>
          </span>
        )}
        {status === 'completed' && (
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Process Again</span>
          </span>
        )}
        {status === 'failed' && (
          <span className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            <span>Retry</span>
          </span>
        )}
      </button>

      {status === 'processing' && jobData && (
        <>
          <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Processing Progress</h3>
              <span className="text-2xl font-bold text-blue-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {jobData.jobDesigns.filter((jd: any) => jd.status === 'completed').length} / {jobData.jobDesigns.length} designs completed
              </span>
              <span className="font-medium">
                {jobData.jobDesigns.filter((jd: any) => jd.status === 'processing').length} processing...
              </span>
            </div>
          </div>

          {/* Show preview of completed designs while processing - Grouped by Design */}
          {jobData.jobDesigns && jobData.jobDesigns.filter((jd: any) => jd.status === 'completed' && jd.outputUrl).length > 0 && (
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Completed Previews
                <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {jobData.jobDesigns.filter((jd: any) => jd.status === 'completed' && jd.outputUrl).length}
                </span>
              </h3>
              
              {/* Group by design */}
              {(() => {
                const completed = jobData.jobDesigns.filter((jd: any) => jd.status === 'completed' && jd.outputUrl)
                const grouped = new Map<string, typeof completed>()
                completed.forEach((jd: any) => {
                  const designName = jd.design.name
                  if (!grouped.has(designName)) {
                    grouped.set(designName, [])
                  }
                  grouped.get(designName)!.push(jd)
                })

                return (
                  <div className="space-y-6">
                    {Array.from(grouped.entries()).map(([designName, items]) => (
                      <div key={designName} className="space-y-2">
                        <div className="flex items-center space-x-2 pb-1 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">{designName}</span>
                          <span className="text-xs text-gray-500">({items.length} mockups)</span>
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {items.map((jd: any) => (
                            <div
                              key={jd.id}
                              className="group relative bg-gray-50 rounded-lg overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all cursor-pointer"
                              onClick={() => {
                                window.open(jd.outputUrl, '_blank')
                              }}
                              title={`${jd.mockup?.name || 'Mockup'} - ${jd.design.name}`}
                            >
                              <div className="aspect-square relative">
                                <img
                                  src={jd.outputUrl}
                                  alt={jd.design.name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                  ✓
                                </div>
                              </div>
                              {jd.mockup?.name && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                                  {jd.mockup.name}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}

      {status === 'completed' && downloadUrl && jobData && (
        <>
          {/* Preview Gallery */}
          {jobData.jobDesigns && jobData.jobDesigns.filter((jd: any) => jd.status === 'completed' && jd.outputUrl).length > 0 && (
            <PreviewGallery
              items={jobData.jobDesigns
                .filter((jd: any) => jd.status === 'completed' && jd.outputUrl)
                .map((jd: any) => ({
                  id: jd.id,
                  outputUrl: jd.outputUrl,
                  designName: jd.design.name,
                  mockupName: jd.mockup?.name,
                }))}
            />
          )}

          {/* Success Message and Download */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">Processing Complete!</h3>
                <p className="text-sm text-green-600">
                  {jobData.jobDesigns?.filter((jd: any) => jd.status === 'completed').length || 0} designs processed successfully
                </p>
              </div>
            </div>
            <a
              href={downloadUrl}
              download
              className="block w-full py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 text-center"
            >
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download ZIP File</span>
              </span>
            </a>
          </div>
        </>
      )}

      {status === 'failed' && (
        <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Processing Failed</h3>
              <p className="text-sm text-red-600">Please check the console for details and try again</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

