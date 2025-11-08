'use client'

import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    google: any
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  onPlaceSelect?: (place: any) => void
}

export default function AddressAutocomplete({ value, onChange, onPlaceSelect }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)

  useEffect(() => {
    // Get API key from environment variables
    // In Next.js, client-side components can only access variables prefixed with NEXT_PUBLIC_
    const key = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || 
                process.env.NEXT_PUBLIC_GOOGLE_PLACES_API || 
                ''
    setApiKey(key)

    if (!key) {
      console.warn('Google Places API key not found. Add NEXT_PUBLIC_GOOGLE_PLACES_API_KEY to your .env.local file')
      setIsLoaded(true) // Still allow manual input
      return
    }

    // Load Google Maps script if not already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      initializeAutocomplete()
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteRef.current)
      }
    }
  }, [])

  const initializeAutocomplete = () => {
    if (!inputRef.current || !window.google?.maps?.places) return

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: [] }, // Remove restriction to allow all countries
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      if (place.formatted_address) {
        onChange(place.formatted_address)
        if (onPlaceSelect) {
          onPlaceSelect(place)
        }
      }
    })

    autocompleteRef.current = autocomplete
    setIsLoaded(true)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing an address..."
        required
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      {!apiKey && (
        <p className="text-xs text-gray-500 mt-1">
          Note: Address autocomplete requires Google Places API key. You can still type manually.
        </p>
      )}
    </div>
  )
}

