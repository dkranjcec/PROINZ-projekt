'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { savePlayerInfo } from './actions'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Button } from '@/components/ui/button'
import { User, Phone } from 'lucide-react'

export default function SetupPlayerForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const phoneNumber = formData.get('phoneNumber') as string
    
    try {
      await savePlayerInfo(userId, firstName, lastName, phoneNumber)
      router.push('/player-dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save player information')
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
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          First Name *
        </label>
        <InputGroup>
          <InputGroupAddon>
            <User className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            id="firstName"
            name="firstName"
            required
            placeholder="Enter your first name"
          />
        </InputGroup>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Last Name *
        </label>
        <InputGroup>
          <InputGroupAddon>
            <User className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            id="lastName"
            name="lastName"
            required
            placeholder="Enter your last name"
          />
        </InputGroup>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Phone Number *
        </label>
        <InputGroup>
          <InputGroupAddon>
            <Phone className="size-4" />
          </InputGroupAddon>
          <InputGroupInput
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            required
            placeholder="Enter your phone number"
          />
        </InputGroup>
      </div>
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {isSubmitting ? 'Saving...' : 'Save Player Information'}
      </Button>
    </form>
  )
}
