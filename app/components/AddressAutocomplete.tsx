'use client'

import { useLoadScript, Autocomplete } from '@react-google-maps/api'
import { useState, useRef } from 'react'
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

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      
      if (place.formatted_address) {
        const lat = place.geometry?.location?.lat() || null
        const lng = place.geometry?.location?.lng() || null
        onChange(place.formatted_address, lat, lng)
      }
    }
  }

  if (loadError) {
    return (
      <div className="text-red-600 text-sm">
        Error loading Google Maps. Please check your API key.
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
    <Autocomplete
      onLoad={onLoad}
      onPlaceChanged={onPlaceChanged}
      options={{
        types: ['address'],
        fields: ['formatted_address', 'geometry'],
      }}
    >
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
    </Autocomplete>
  )
}
