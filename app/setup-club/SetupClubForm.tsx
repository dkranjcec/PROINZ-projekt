'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveClubInfo } from './actions'
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupTextarea } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, FileText } from 'lucide-react'

// AI korišten za pomoć pri stvaranju forme

export default function SetupClubForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clubAddress, setClubAddress] = useState('')
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const clubName = formData.get('clubName') as string
    const rules = formData.get('rules') as string
    
    try {
      await saveClubInfo(userId, clubName, clubAddress, rules)
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
      
      <div className="space-y-2">
        <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">
          Club Name *
        </label>
        <InputGroup>
          <InputGroupAddon>
            <Building2 className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            id="clubName"
            name="clubName"
            required
            placeholder="Enter your club name"
          />
        </InputGroup>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="clubAddress" className="block text-sm font-medium text-gray-700">
          Club Address *
        </label>
        <InputGroup>
          <InputGroupAddon>
            <MapPin className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            id="clubAddress"
            name="clubAddress"
            value={clubAddress}
            onChange={(e) => setClubAddress(e.target.value)}
            required
            placeholder="Enter your club address"
          />
        </InputGroup>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="rules" className="block text-sm font-medium text-gray-700">
          Club Rules *
        </label>
        <InputGroup>
          <InputGroupAddon align="block-start">
            <FileText className="size-4" />
            <span>Rules</span>
          </InputGroupAddon>
          <InputGroupTextarea
            id="rules"
            name="rules"
            required
            rows={6}
            placeholder="Enter your club rules and regulations"
          />
        </InputGroup>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isSubmitting ? 'Saving...' : 'Save Club Information'}
      </Button>
    </form>
  )
}

