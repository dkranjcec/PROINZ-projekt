'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Player {
  firstname: string
  lastname: string
  phone_number: string
  preferred_time_start: string
  preferred_time_end: string
  skill_level: string
}

interface EditablePlayerDashboardProps {
  player: Player
}

export default function EditablePlayerDashboard({ player }: EditablePlayerDashboardProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [firstName, setFirstName] = useState(player.firstname || '')
  const [lastName, setLastName] = useState(player.lastname || '')
  const [phoneNumber, setPhoneNumber] = useState(player.phone_number || '')
  const [preferredTimeStart, setPreferredTimeStart] = useState(player.preferred_time_start || '')
  const [preferredTimeEnd, setPreferredTimeEnd] = useState(player.preferred_time_end || '')
  const [skillLevel, setSkillLevel] = useState(player.skill_level || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function formatTime(time: string) {
    return time.substring(0, 5)
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/player/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phoneNumber,
          preferredTimeStart,
          preferredTimeEnd,
          skillLevel,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update player information')
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
    setFirstName(player.firstname)
    setLastName(player.lastname)
    setPhoneNumber(player.phone_number || '')
    setPreferredTimeStart(player.preferred_time_start || '')
    setPreferredTimeEnd(player.preferred_time_end || '')
    setSkillLevel(player.skill_level || '')
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
            Edit Information
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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            {isEditing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            {isEditing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            ) : (
              <p className="text-gray-900">{phoneNumber || 'Not set'}</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Preferred Playing Time</h2>
        <div className="space-y-3">
          {isEditing ? (
            <div className="flex gap-2 items-center">
              <input
                type="time"
                value={preferredTimeStart}
                onChange={(e) => setPreferredTimeStart(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="time"
                value={preferredTimeEnd}
                onChange={(e) => setPreferredTimeEnd(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
              />
            </div>
          ) : (
            <p className="text-gray-600">
              {preferredTimeStart && preferredTimeEnd ? `${formatTime(preferredTimeStart)} - ${formatTime(preferredTimeEnd)}` : 'Not set'}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Skill Level</h2>
        {isEditing ? (
          <Select
            value={skillLevel}
            onValueChange={setSkillLevel}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select skill level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="skilled">Skilled</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <p className="text-gray-900 capitalize">{skillLevel || 'Not set'}</p>
        )}
      </div>

      {!isEditing && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/browse-clubs">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Browse Clubs
            </Button>
          </Link>
        </div>
      )}
    </>
  )
}
