/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null
  }

  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  
  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate overlap in minutes between player's preferred time and club's work hours
 * Returns total minutes of overlap across all days, or null if no data
 */
export function calculateTimeOverlap(
  playerPreferredStart: string | null,
  playerPreferredEnd: string | null,
  clubWorkHours: Array<{ day_of_week: number; start_time: string; end_time: string }>
): number | null {
  if (!playerPreferredStart || !playerPreferredEnd || !clubWorkHours || clubWorkHours.length === 0) {
    return null
  }

  let totalOverlapMinutes = 0

  for (const workHour of clubWorkHours) {
    const clubStart = workHour.start_time.substring(0, 5) // HH:MM
    const clubEnd = workHour.end_time.substring(0, 5) // HH:MM

    // Calculate overlap for this day
    const overlapStart = maxTime(playerPreferredStart, clubStart)
    const overlapEnd = minTime(playerPreferredEnd, clubEnd)

    if (overlapStart < overlapEnd) {
      const overlapMinutes = timeToMinutes(overlapEnd) - timeToMinutes(overlapStart)
      totalOverlapMinutes += overlapMinutes
    }
  }

  return totalOverlapMinutes
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Return the later of two times
 */
function maxTime(time1: string, time2: string): string {
  return timeToMinutes(time1) > timeToMinutes(time2) ? time1 : time2
}

/**
 * Return the earlier of two times
 */
function minTime(time1: string, time2: string): string {
  return timeToMinutes(time1) < timeToMinutes(time2) ? time1 : time2
}

/**
 * Format distance for display
 */
export function formatDistance(distance: number | null): string {
  if (distance === null) return 'Distance unknown'
  if (distance < 1) return `${Math.round(distance * 1000)}m away`
  return `${distance}km away`
}

/**
 * Format overlap for display
 */
export function formatOverlap(minutes: number | null): string {
  if (minutes === null || minutes === 0) return 'No matching hours'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m overlap`
  if (hours > 0) return `${hours}h overlap`
  return `${mins}m overlap`
}
