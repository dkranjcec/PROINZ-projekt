'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveClubInfo } from './actions'

// AI korišten za pomoć pri stvaranju forme

export default function SetupClubForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubAddress, setClubAddress] = useState('')
  const [workHours, setWorkHours] = useState<Array<{ day_of_week: number; start_time: string; end_time: string }>>([])

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  function updateWorkHour(dayOfWeek: number, field: 'start_time' | 'end_time', value: string) {
    setWorkHours(prev => 
      prev.map(wh => 
        wh.day_of_week === dayOfWeek 
          ? { ...wh, [field]: value }
          : wh
      )
    )
  }

  function addWorkHour(dayOfWeek: number) {
    setWorkHours(prev => [
      ...prev,
      {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00'
      }
    ].sort((a, b) => a.day_of_week - b.day_of_week))
  }

  function removeWorkHour(dayOfWeek: number) {
    setWorkHours(prev => prev.filter(wh => wh.day_of_week !== dayOfWeek))
  }

  function getAvailableDays() {
    const usedDays = workHours.map(wh => wh.day_of_week)
    return dayNames.map((name, index) => ({ index: index + 1, name })).filter(day => !usedDays.includes(day.index))
  }
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const clubName = formData.get('clubName') as string
    const rules = formData.get('rules') as string
    
    try {
      await saveClubInfo(userId, clubName, clubAddress, rules, JSON.stringify(workHours))
      router.push('/club-dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save club information')
      setIsSubmitting(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="clubName" className="block text-sm font-medium text-gray-700 mb-2">
          Club Name *
        </label>
        <input
          type="text"
          id="clubName"
          name="clubName"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Enter your club name"
        />
      </div>
      
      <div>
        <label htmlFor="clubAddress" className="block text-sm font-medium text-gray-700 mb-2">
          Club Address *
        </label>
        <input
          type="text"
          id="clubAddress"
          name="clubAddress"
          value={clubAddress}
          onChange={(e) => setClubAddress(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Enter your club address"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Work Hours *
        </label>
        {workHours.length > 0 ? (
          <div className="space-y-3 mb-4">
            {workHours.map((wh) => (
              <div key={wh.day_of_week} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-700 w-32">{dayNames[wh.day_of_week - 1]}</span>
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
                    type="button"
                    onClick={() => removeWorkHour(wh.day_of_week)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mb-4">No work hours set. Add at least one day.</p>
        )}
        
        {getAvailableDays().length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Add Day:</p>
            <div className="flex flex-wrap gap-2">
              {getAvailableDays().map(day => (
                <button
                  key={day.index}
                  type="button"
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
      
      <div>
        <label htmlFor="rules" className="block text-sm font-medium text-gray-700 mb-2">
          Club Rules *
        </label>
        <textarea
          id="rules"
          name="rules"
          required
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Enter your club rules and regulations"
        />
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving...' : 'Save Club Information'}
      </button>
    </form>
  )
}

