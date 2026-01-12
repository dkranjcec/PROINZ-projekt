export interface Booking {
  starttime: string
  endtime: string
}

export function checkBookingOverlap(
  existingBooking: Booking,
  newBooking: Booking
): boolean {
  const existingStart = new Date(existingBooking.starttime).getTime()
  const existingEnd = new Date(existingBooking.endtime).getTime()
  const newStart = new Date(newBooking.starttime).getTime()
  const newEnd = new Date(newBooking.endtime).getTime()

  return (
    (newStart >= existingStart && newStart < existingEnd) ||
    (newEnd > existingStart && newEnd <= existingEnd) ||
    (newStart <= existingStart && newEnd >= existingEnd)
  )
}

export function hasAnyOverlap(
  existingBookings: Booking[],
  newBooking: Booking
): boolean {
  return existingBookings.some(booking => 
    checkBookingOverlap(booking, newBooking)
  )
}

export function validateBookingFields(data: any): {
  valid: boolean
  error?: string
} {
  if (!data.terenid) {
    return { valid: false, error: 'Missing terenid' }
  }
  if (!data.clubid) {
    return { valid: false, error: 'Missing clubid' }
  }
  if (!data.starttime) {
    return { valid: false, error: 'Missing starttime' }
  }
  if (!data.endtime) {
    return { valid: false, error: 'Missing endtime' }
  }
  return { valid: true }
}
