'use client'

import { useState, useEffect, useRef } from 'react'
import { addPhoto, deletePhoto, getPhotos } from './actions'

interface DeleteConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  photoUrl: string
}

function DeleteConfirmDialog({ isOpen, onClose, onConfirm, photoUrl }: DeleteConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* cursor composer 1 model was used */}
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Delete Photo?
          </h3>
          
          <p className="text-sm text-gray-500 text-center mb-4">
            Are you sure you want to delete this photo? This action cannot be undone.
          </p>
          
          {/* Preview thumbnail */}
          <div className="mb-6 flex justify-center">
            <img 
              src={photoUrl} 
              alt="Preview" 
              className="max-h-32 rounded-lg border border-gray-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm()
                onClose()
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PhotosSection({ userId }: { userId: string }) {
  const [photos, setPhotos] = useState<Array<{ photolink: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; photoUrl: string }>({ 
    isOpen: false, 
    photoUrl: '' 
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    loadPhotos()
  }, [])
  
  async function loadPhotos() {
    try {
      setIsLoading(true)
      const data = await getPhotos(userId)
      setPhotos((data || []) as unknown as Array<{ photolink: string }>)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos')
    } finally {
      setIsLoading(false)
    }
  }
  
  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch('/api/upload-photo', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload photo')
    }
    
    const data = await response.json()
    return data.photoLink
  }
  
  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    setError(null)
    
    try {
      const uploadPromises = Array.from(files).map(file => uploadFile(file))
      const photoLinks = await Promise.all(uploadPromises)
      
      // Add all photos to database
      for (const link of photoLinks) {
        await addPhoto(userId, link)
      }
      
      await loadPhotos()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photos')
    } finally {
      setIsUploading(false)
    }
  }
  
  function handleDeleteClick(link: string) {
    setDeleteDialog({ isOpen: true, photoUrl: link })
  }
  
  async function handleDeleteConfirm() {
    try {
      await deletePhoto(userId, deleteDialog.photoUrl)
      await loadPhotos()
      setDeleteDialog({ isOpen: false, photoUrl: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo')
      setDeleteDialog({ isOpen: false, photoUrl: '' })
    }
  }
  
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }
  
  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFileUpload(e.target.files)
  }
  
  return (
    <div className="space-y-6">
      {/* cursor composer 1 model was used */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Club Photos</h2>
        <p className="text-gray-600 mb-6">Upload photos by dragging and dropping or selecting files</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Drag and Drop Zone */}
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6
            ${isDragging 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="space-y-4">
            <div className="text-4xl">📷</div>
            <div>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragging ? 'Drop photos here' : 'Drag and drop photos here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Select Photos'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Supports JPG, PNG, GIF (max 10MB per file)
            </p>
          </div>
        </div>
        
        {/* Photos Grid */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8 border border-gray-200 rounded-lg">
            <p className="text-gray-500">No photos added yet. Upload some photos to get started!</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <div key={index} className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="w-full h-64">
                    <img
                      src={photo.photolink}
                      alt={`Club photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.error('Image failed to load:', photo.photolink, e)
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E'
                      }}
                      onLoad={(e) => {
                        console.log('Image loaded successfully:', photo.photolink)
                        const target = e.target as HTMLImageElement
                        console.log('Image dimensions:', target.naturalWidth, 'x', target.naturalHeight)
                      }}
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full bg-black opacity-0 group-hover:opacity-50 transition-opacity"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <button
                      onClick={() => handleDeleteClick(photo.photolink)}
                      className="opacity-0 group-hover:opacity-100 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-opacity"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, photoUrl: '' })}
        onConfirm={handleDeleteConfirm}
        photoUrl={deleteDialog.photoUrl}
      />
    </div>
  )
}
