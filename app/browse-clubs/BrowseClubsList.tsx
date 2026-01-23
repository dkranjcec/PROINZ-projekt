'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import { filterClubs, type Club } from '@/lib/club-utils'
import { calculateDistance, calculateTimeOverlap, formatDistance, formatOverlap } from '@/lib/club-sorting-utils'

interface BrowseClubsListProps {
  clubs: Club[]
  playerData: {
    preferred_time_start: string | null
    preferred_time_end: string | null
  } | null
  workHoursByClub: Record<string, Array<{ day_of_week: number; start_time: string; end_time: string }>>
}

type SortOption = 'name' | 'distance' | 'time-overlap'

export default function BrowseClubsList({ clubs, playerData, workHoursByClub }: BrowseClubsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setIsRequestingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsRequestingLocation(false)
        // Only auto-switch if currently on name sort
        if (sortBy === 'name') {
          setSortBy('distance')
        }
      },
      (error) => {
        setLocationError('Unable to get your location. Please enable location access.')
        setIsRequestingLocation(false)
      }
    )
  }

  const filteredAndSortedClubs = useMemo(() => {
    // First filter
    let result = filterClubs(clubs, searchQuery)

    // Then sort
    switch (sortBy) {
      case 'distance':
        if (userLocation?.latitude && userLocation?.longitude) {
          result = [...result].sort((a, b) => {
            const distA = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              a.latitude,
              a.longitude
            )
            const distB = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              b.latitude,
              b.longitude
            )
            // Nulls last
            if (distA === null) return 1
            if (distB === null) return -1
            return distA - distB
          })
        }
        break

      case 'time-overlap':
        if (playerData?.preferred_time_start && playerData?.preferred_time_end) {
          result = [...result].sort((a, b) => {
            const overlapA = calculateTimeOverlap(
              playerData.preferred_time_start,
              playerData.preferred_time_end,
              workHoursByClub[a.userid] || []
            )
            const overlapB = calculateTimeOverlap(
              playerData.preferred_time_start,
              playerData.preferred_time_end,
              workHoursByClub[b.userid] || []
            )
            // Sort descending (most overlap first), nulls last
            if (overlapA === null) return 1
            if (overlapB === null) return -1
            return overlapB - overlapA
          })
        }
        break

      case 'name':
      default:
        // Already sorted by name from database
        break
    }

    return result
  }, [clubs, searchQuery, sortBy, playerData, workHoursByClub, userLocation])

  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search clubs by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by:</label>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="distance" disabled={!userLocation}>
                Distance {!userLocation && '(enable location)'}
              </SelectItem>
              <SelectItem value="time-overlap" disabled={!playerData?.preferred_time_start || !playerData?.preferred_time_end}>
                Time Match {!playerData?.preferred_time_start && '(set hours)'}
              </SelectItem>
            </SelectContent>
          </Select>
          {!userLocation && (
            <Button
              onClick={requestLocation}
              disabled={isRequestingLocation}
              size="sm"
              variant="secondary"
              className="whitespace-nowrap"
            >
              {isRequestingLocation ? 'Getting location...' : '📍 Enable'}
            </Button>
          )}
        </div>
        {locationError && (
          <p className="text-xs text-red-600">{locationError}</p>
        )}
      </div>

      {filteredAndSortedClubs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <p className="text-gray-500 text-center">
            {searchQuery ? 'No clubs match your search' : 'No clubs available yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredAndSortedClubs.map((club) => {
              const distance = userLocation ? calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                club.latitude,
                club.longitude
              ) : null

              const overlap = (playerData?.preferred_time_start && playerData?.preferred_time_end)
                ? calculateTimeOverlap(
                    playerData.preferred_time_start,
                    playerData.preferred_time_end,
                    workHoursByClub[club.userid] || []
                  )
                : null

              return (
                <div key={club.userid} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {club.clubname}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center mb-1">
                        <span className="mr-1">📍</span>
                        {club.clubaddress}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {distance !== null && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {formatDistance(distance)}
                          </span>
                        )}
                        {overlap !== null && overlap > 0 && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {formatOverlap(overlap)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link href={`/club/${club.userid}`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 whitespace-nowrap">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
