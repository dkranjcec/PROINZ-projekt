'use client'

import { useLoadScript } from '@react-google-maps/api'
import { useState, useRef, useEffect } from 'react'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { MapPin } from 'lucide-react'

const libraries: ("places")[] = ['places']

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, lat: number | null, lng: number | null) => void
  required?: boolean
  placeholder?: string
}

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  required = false,
  placeholder = "Start typing an address..."
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  })

  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        fields: ['formatted_address', 'geometry'],
      })

      const listener = autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        if (place?.formatted_address) {
          const lat = place.geometry?.location?.lat() || null
          const lng = place.geometry?.location?.lng() || null
          onChange(place.formatted_address, lat, lng)
        }
      })

      return () => {
        google.maps.event.removeListener(listener)
      }
    }
  }, [isLoaded, onChange])

  if (loadError) {
    return (
      <div className="text-red-600 text-sm">
        Error loading Google Maps.
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <InputGroup>
        <InputGroupAddon>
          <MapPin className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          placeholder="Loading..."
          disabled
        />
      </InputGroup>
    )
  }

  return (
    <InputGroup>
      <InputGroupAddon>
        <MapPin className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, null, null)}
        required={required}
        placeholder={placeholder}
      />
    </InputGroup>
  )
}
