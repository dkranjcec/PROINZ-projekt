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

    const start = new Date(starttime)
    const end = new Date(endtime)

    // Get day of week (JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday)
    // Convert to database format (1=Monday, 2=Tuesday, ..., 7=Sunday)
    const jsDay = start.getDay()
    const dbDay = jsDay === 0 ? 7 : jsDay

    // Check if booking spans multiple days
    if (start.getDate() !== end.getDate()) {
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

    // Format booking times as HH:MM for comparison
    const bookingStartTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    const bookingEndTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

    // Check if booking falls within any of the work hour ranges for this day
    const isWithinWorkHours = dayWorkHours.some(wh => {
      const workStart = wh.start_time.substring(0, 5) // Get HH:MM
      const workEnd = wh.end_time.substring(0, 5)

      return bookingStartTime >= workStart && bookingEndTime <= workEnd
    })

    if (!isWithinWorkHours) {
      const hoursStr = dayWorkHours
        .map(wh => `${wh.start_time.substring(0, 5)}-${wh.end_time.substring(0, 5)}`)
        .join(', ')
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
