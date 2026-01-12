'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupInput } from '@/components/ui/input-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2 } from 'lucide-react'

interface Court {
  terenid?: number
  terenname: string
  type: 'indoor' | 'outdoor'
  size: 'single' | 'double'
  ground: string
  height?: number | null
  lights?: 'yes' | 'no' | null
  photos: string[]
}

interface EditableCourtManagementProps {
  courts: Court[]
}

export default function EditableCourtManagement({ courts }: EditableCourtManagementProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [editableCourts, setEditableCourts] = useState<Court[]>(courts)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingPhotoForCourt, setUploadingPhotoForCourt] = useState<number | null>(null)

  function addCourt() {
    setEditableCourts(prev => [{
      terenname: '',
      type: 'outdoor',
      size: 'single',
      ground: '',
      height: null,
      lights: 'yes',
      photos: []
    }, ...prev])
  }

  function removeCourt(index: number) {
    setEditableCourts(prev => prev.filter((_, i) => i !== index))
  }

  function updateCourt(index: number, field: keyof Court, value: string | number | null) {
    setEditableCourts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      
      // Reset conditional fields when type changes
      if (field === 'type') {
        if (value === 'indoor') {
          updated[index].lights = null
          updated[index].height = updated[index].height || 0
        } else {
          updated[index].height = null
          updated[index].lights = updated[index].lights || 'yes'
        }
      }
      
      return updated
    })
  }

  async function handlePhotoUpload(courtIndex: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhotoForCourt(courtIndex)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/court/upload-court-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload photo')
      }

      const { photoUrl } = await response.json()
      
      setEditableCourts(prev => {
        const updated = [...prev]
        // Only add if photo URL doesn't already exist
        if (!updated[courtIndex].photos.includes(photoUrl)) {
          updated[courtIndex].photos = [...updated[courtIndex].photos, photoUrl]
        }
        return updated
      })

      // Reset the input
      e.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setUploadingPhotoForCourt(null)
    }
  }

  function removePhoto(courtIndex: number, photoIndex: number) {
    setEditableCourts(prev => {
      const updated = [...prev]
      updated[courtIndex].photos = updated[courtIndex].photos.filter((_, i) => i !== photoIndex)
      return updated
    })
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    // Validate courts
    for (const court of editableCourts) {
      if (!court.terenname.trim()) {
        setError('All courts must have a name')
        setIsSaving(false)
        return
      }
      if (court.type === 'indoor' && (!court.height || court.height <= 0)) {
        setError('Indoor courts must have a valid height')
        setIsSaving(false)
        return
      }
    }

    try {
      const response = await fetch('/api/court/update-courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courts: editableCourts }),
      })

      if (!response.ok) {
        throw new Error('Failed to update courts')
      }

      setIsEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    setEditableCourts(courts)
    setIsEditing(false)
    setError(null)
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-end mb-4">
        {!isEditing ? (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Edit Courts
          </Button>
        ) : (
          <div className="space-x-2">
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mb-4">
          <Button
            onClick={addCourt}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Court
          </Button>
        </div>
      )}

      {editableCourts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500 text-center">No courts added yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...editableCourts]
            .sort((a, b) => {
              // When editing, new courts (without terenid) come first
              if (isEditing) {
                if (!a.terenid && b.terenid) return -1
                if (a.terenid && !b.terenid) return 1
              }
              // Sort all courts alphabetically by name
              return a.terenname.toLowerCase().localeCompare(b.terenname.toLowerCase())
            })
            .map((court) => {
              const index = editableCourts.indexOf(court)
              return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {court.terenname || 'New Court'}
                    </h3>
                    <Button
                      onClick={() => removeCourt(index)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="size-4 mr-1" />
                      Remove Court
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Court Name *
                      </label>
                      <InputGroup>
                        <InputGroupInput
                          type="text"
                          value={court.terenname}
                          onChange={(e) => updateCourt(index, 'terenname', e.target.value)}
                        />
                      </InputGroup>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <Select
                        value={court.type}
                        onValueChange={(value) => updateCourt(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="indoor">Indoor</SelectItem>
                          <SelectItem value="outdoor">Outdoor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size *
                      </label>
                      <Select
                        value={court.size}
                        onValueChange={(value) => updateCourt(index, 'size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="double">Double</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ground
                      </label>
                      <InputGroup>
                        <InputGroupInput
                          type="text"
                          value={court.ground || ''}
                          onChange={(e) => updateCourt(index, 'ground', e.target.value)}
                        />
                      </InputGroup>
                    </div>

                    {court.type === 'indoor' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Height (cm) *
                        </label>
                        <InputGroup>
                          <InputGroupInput
                            type="number"
                            value={court.height || ''}
                            onChange={(e) => updateCourt(index, 'height', parseInt(e.target.value) || 0)}
                          />
                        </InputGroup>
                      </div>
                    )}

                    {court.type === 'outdoor' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lights *
                        </label>
                        <Select
                          value={court.lights || 'no'}
                          onValueChange={(value) => updateCourt(index, 'lights', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Photos
                    </label>
                    {court.photos && court.photos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {court.photos.map((photo, photoIndex) => (
                          <div key={`${photo}-${photoIndex}`} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                            <img
                              src={photo}
                              alt={`Court photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <Button
                              onClick={() => removePhoto(index, photoIndex)}
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 mb-4">No photos available</p>
                    )}
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Add Photo:</p>
                      <div className="flex gap-2 items-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(index, e)}
                          disabled={uploadingPhotoForCourt === index}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {uploadingPhotoForCourt === index && (
                          <span className="text-sm text-gray-500">Uploading...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{court.terenname}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Type:</span>
                      <p className="font-medium capitalize">{court.type}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Size:</span>
                      <p className="font-medium capitalize">{court.size}</p>
                    </div>
                    {court.ground && (
                      <div>
                        <span className="text-sm text-gray-500">Ground:</span>
                        <p className="font-medium">{court.ground}</p>
                      </div>
                    )}
                    {court.type === 'indoor' && court.height && (
                      <div>
                        <span className="text-sm text-gray-500">Height:</span>
                        <p className="font-medium">{court.height} cm</p>
                      </div>
                    )}
                    {court.type === 'outdoor' && court.lights && (
                      <div>
                        <span className="text-sm text-gray-500">Lights:</span>
                        <p className="font-medium capitalize">{court.lights}</p>
                      </div>
                    )}
                  </div>
                  {court.photos && court.photos.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Photos:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {court.photos.map((photo, photoIndex) => (
                          <div key={photoIndex} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={photo}
                              alt={`Court photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )})}
        </div>
      )}
    </>
  )
}
