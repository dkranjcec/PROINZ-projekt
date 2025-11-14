'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EditableClubDashboardProps {
  club: any
  workHours: any[]
  content: any
  clubPhotos: any[]
}

export default function EditableClubDashboard({ club, workHours, content, clubPhotos }: EditableClubDashboardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [clubName, setClubName] = useState(club.clubname)
  const [clubAddress, setClubAddress] = useState(club.clubaddress)
  const [clubRules, setClubRules] = useState(club.rules || '')
  const [editableWorkHours, setEditableWorkHours] = useState(workHours)
  const [editableContent, setEditableContent] = useState(content?.contenttext || '')
  const [editablePhotos, setEditablePhotos] = useState(clubPhotos)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  function updateWorkHour(dayOfWeek: number, field: 'start_time' | 'end_time', value: string) {
    setEditableWorkHours(prev => 
      prev.map(wh => 
        wh.day_of_week === dayOfWeek 
          ? { ...wh, [field]: value }
          : wh
      )
    )
  }

  function addWorkHour(dayOfWeek: number) {
    setEditableWorkHours(prev => [
      ...prev,
      {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00',
        userid: club.userid
      }
    ].sort((a, b) => a.day_of_week - b.day_of_week))
  }

  function removeWorkHour(dayOfWeek: number) {
    setEditableWorkHours(prev => prev.filter(wh => wh.day_of_week !== dayOfWeek))
  }

  function getAvailableDays() {
    const usedDays = editableWorkHours.map(wh => wh.day_of_week)
    return dayNames.map((name, index) => ({ index, name })).filter(day => !usedDays.includes(day.index))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingPhoto(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/club/upload-photo', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload photo')
      }

      const { photoUrl } = await response.json()
      setEditablePhotos(prev => [...prev, { photolink: photoUrl, userid: club.userid }])
      
      
      e.target.value = ''
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  function removePhoto(index: number) {
    setEditablePhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/club/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName,
          clubAddress,
          clubRules,
          workHours: editableWorkHours,
          content: editableContent,
          photos: editablePhotos,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update club information')
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
    setClubName(club.clubname)
    setClubAddress(club.clubaddress)
    setClubRules(club.rules || '')
    setEditableWorkHours(workHours)
    setEditableContent(content?.contenttext || '')
    setEditablePhotos(clubPhotos)
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
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Edit Information
          </button>
        ) : (
          <div className="space-x-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Club Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
            {isEditing ? (
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{clubName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            {isEditing ? (
              <input
                type="text"
                value={clubAddress}
                onChange={(e) => setClubAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{clubAddress}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Work Hours</h2>
        {editableWorkHours && editableWorkHours.length > 0 ? (
          <div className="space-y-3">
            {editableWorkHours.map((wh: any) => (
              <div key={wh.day_of_week} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-700 w-32">{dayNames[wh.day_of_week]}</span>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={wh.start_time}
                      onChange={(e) => updateWorkHour(wh.day_of_week, 'start_time', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={wh.end_time}
                      onChange={(e) => updateWorkHour(wh.day_of_week, 'end_time', e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={() => removeWorkHour(wh.day_of_week)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <span className="text-gray-600">{wh.start_time} - {wh.end_time}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No work hours set</p>
        )}
        
        {isEditing && getAvailableDays().length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Day:</p>
            <div className="flex flex-wrap gap-2">
              {getAvailableDays().map(day => (
                <button
                  key={day.index}
                  onClick={() => addWorkHour(day.index)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                >
                  + {day.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Club Rules</h2>
        {isEditing ? (
          <textarea
            value={clubRules}
            onChange={(e) => setClubRules(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 min-h-[150px]"
          />
        ) : (
          <textarea
            readOnly
            value={clubRules || 'No rules set'}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 min-h-[150px] resize-none"
          />
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Content</h2>
        {isEditing ? (
          <textarea
            value={editableContent}
            onChange={(e) => setEditableContent(e.target.value)}
            placeholder="Enter club content/description..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-700 min-h-[150px]"
          />
        ) : (
          editableContent ? (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <p className="text-gray-700 whitespace-pre-wrap">{editableContent}</p>
            </div>
          ) : (
            <p className="text-gray-500">No content available</p>
          )
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Club Photos</h2>
        {editablePhotos && editablePhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editablePhotos.map((photo: any, index: number) => (
              <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                <img
                  src={photo.photolink}
                  alt={`Club photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No photos available</p>
        )}
        
        {isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Photo:</p>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              {isUploadingPhoto && (
                <span className="text-sm text-gray-500">Uploading...</span>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
