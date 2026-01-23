import sql from './db'

interface WorkHour {
  day_of_week: number
  start_time: string
  end_time: string
}

/**
 * Check if a booking time falls within the club's work hours
 * @param clubId - The club's user ID
 * @param starttime - Booking start time (ISO string)
 * @param endtime - Booking end time (ISO string)
 * @returns Object with valid boolean and optional error message
 */
export async function validateBookingWithinWorkHours(
  clubId: string,
  starttime: string,
  endtime: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Get work hours for the club
    const workHours = await sql<WorkHour[]>`
      SELECT day_of_week, start_time, end_time
      FROM workhours
      WHERE userid = ${clubId}
    `

    // If no work hours are set, allow booking (club is always open)
    if (workHours.length === 0) {
      return { valid: true }
    }

    // Parse booking times and convert to Europe/Zagreb timezone for comparison
    // This ensures we compare booking times with work hours in the same timezone
    const start = new Date(starttime)
    const end = new Date(endtime)

    // Convert to Europe/Zagreb timezone for accurate day and time comparison
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Zagreb',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })

    // Get day of week in Europe/Zagreb timezone
    // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
    // Database: 1=Monday, 2=Tuesday, ..., 7=Sunday
    const startParts = formatter.formatToParts(start)
    const endParts = formatter.formatToParts(end)
    
    const startDay = new Date(
      parseInt(startParts.find(p => p.type === 'year')!.value),
      parseInt(startParts.find(p => p.type === 'month')!.value) - 1,
      parseInt(startParts.find(p => p.type === 'day')!.value)
    )
    const endDay = new Date(
      parseInt(endParts.find(p => p.type === 'year')!.value),
      parseInt(endParts.find(p => p.type === 'month')!.value) - 1,
      parseInt(endParts.find(p => p.type === 'day')!.value)
    )

    const jsDay = startDay.getDay()
    const dbDay = jsDay === 0 ? 7 : jsDay

    // Check if booking spans multiple days (in Europe/Zagreb timezone)
    if (startDay.getTime() !== endDay.getTime()) {
      return { 
        valid: false, 
        error: 'Bookings cannot span multiple days' 
      }
    }

    // Find work hours for this day
    const dayWorkHours = workHours.filter(wh => wh.day_of_week === dbDay)

    if (dayWorkHours.length === 0) {
      return { 
        valid: false, 
        error: 'The club is closed on this day' 
      }
    }

    // Format booking times as HH:MM in Europe/Zagreb timezone for comparison
    const bookingStartTime = `${startParts.find(p => p.type === 'hour')!.value}:${startParts.find(p => p.type === 'minute')!.value}`
    const bookingEndTime = `${endParts.find(p => p.type === 'hour')!.value}:${endParts.find(p => p.type === 'minute')!.value}`

    // Check if booking falls within any of the work hour ranges for this day
    const isWithinWorkHours = dayWorkHours.some(wh => {
      const workStart = wh.start_time.substring(0, 5) // Get HH:MM
      const workEnd = wh.end_time.substring(0, 5)

      const isValid = bookingStartTime >= workStart && bookingEndTime <= workEnd
      
      // Debug logging
      console.log('[WORKHOURS] Comparing:', {
        bookingTime: `${bookingStartTime}-${bookingEndTime}`,
        workHours: `${workStart}-${workEnd}`,
        isValid,
        dayOfWeek: dbDay
      })

      return isValid
    })

    if (!isWithinWorkHours) {
      const hoursStr = dayWorkHours
        .map(wh => `${wh.start_time.substring(0, 5)}-${wh.end_time.substring(0, 5)}`)
        .join(', ')
      console.error('[WORKHOURS] Validation failed:', {
        bookingTime: `${bookingStartTime}-${bookingEndTime}`,
        workHours: hoursStr,
        dayOfWeek: dbDay,
        originalStarttime: starttime,
        originalEndtime: endtime
      })
      return { 
        valid: false, 
        error: `Booking must be within work hours: ${hoursStr}` 
      }
    }

    return { valid: true }
  } catch (error) {
    console.error('Error validating work hours:', error)
    return { 
      valid: false, 
      error: 'Failed to validate work hours' 
    }
  }
}
