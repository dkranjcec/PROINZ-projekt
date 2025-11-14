'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveClubInfo } from './actions'
import WorkHoursSelector from './WorkHoursSelector'

export default function SetupClubForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubAddress, setClubAddress] = useState('')
  const [workHours, setWorkHours] = useState<Record<string, { start: string; end: string; closed: boolean }>>({})
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const clubName = formData.get('clubName') as string
    const rules = formData.get('rules') as string
    
    try {
      // Pass work hours as JSON string for storage in the workhours table
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
        <WorkHoursSelector
          onChange={setWorkHours}
        />
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

