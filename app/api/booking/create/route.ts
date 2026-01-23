import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateBookingFields, hasAnyOverlap } from '@/lib/booking-utils'
import { notifyClubNewBooking } from '@/lib/notifications'
import { validateBookingWithinWorkHours } from '@/lib/workhours-utils'
// AI korišten za pomoć pri stvaranju rute za stvaranje rezervacije
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { terenid, clubid, starttime, endtime, paymentMethod = 'in_person' } = body

    const validation = validateBookingFields(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Prevent retroactive bookings
    const bookingStart = new Date(starttime)
    const bookingEnd = new Date(endtime)
    const now = new Date()
    if (bookingStart < now) {
      return NextResponse.json({ error: 'Cannot create bookings in the past' }, { status: 400 })
    }

    // Validate minimum 1-hour booking duration
    const durationMs = bookingEnd.getTime() - bookingStart.getTime()
    const durationHours = durationMs / (1000 * 60 * 60)
    if (durationHours < 1) {
      return NextResponse.json({ error: 'Minimum booking duration is 1 hour' }, { status: 400 })
    }

    // Validate payment method
    if (!['in_person', 'online'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const existingBookings = await sql`
      SELECT starttime, endtime FROM termin 
      WHERE terenid = ${terenid}
    `

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (hasAnyOverlap(existingBookings as any, { starttime, endtime })) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 })
    }

    // Check for conflicts with recurring bookings
    const recurringBookings = await sql`
      SELECT day_of_week, start_time, end_time
      FROM recurring_booking
      WHERE terenid = ${terenid}
        AND is_active = true
    `

    // Check if booking conflicts with any recurring booking pattern
    const bookingDayOfWeek = bookingStart.getDay() === 0 ? 7 : bookingStart.getDay()
    const bookingStartTime = starttime.split('T')[1].substring(0, 5) // HH:MM
    const bookingEndTime = endtime.split('T')[1].substring(0, 5) // HH:MM

    for (const recurring of recurringBookings) {
      if (recurring.day_of_week === bookingDayOfWeek) {
        // Check if times overlap
        const recurringStart = recurring.start_time.substring(0, 5)
        const recurringEnd = recurring.end_time.substring(0, 5)
        
        if (
          (bookingStartTime >= recurringStart && bookingStartTime < recurringEnd) ||
          (bookingEndTime > recurringStart && bookingEndTime <= recurringEnd) ||
          (bookingStartTime <= recurringStart && bookingEndTime >= recurringEnd)
        ) {
          return NextResponse.json({ 
            error: 'This time slot conflicts with an active recurring booking' 
          }, { status: 409 })
        }
      }
    }

    // Validate booking is within club work hours
    const workHoursValidation = await validateBookingWithinWorkHours(clubid, starttime, endtime)
    if (!workHoursValidation.valid) {
      return NextResponse.json({ error: workHoursValidation.error }, { status: 400 })
    }

    // Only handle in-person payment here
    // Online payments are handled through Stripe checkout session
    if (paymentMethod === 'online') {
      return NextResponse.json({ error: 'Use /api/stripe/create-checkout-session for online payments' }, { status: 400 })
    }

    // For in-person payment, create unconfirmed booking
    const result = await sql`
      INSERT INTO termin (terenid, playerid, clubid, starttime, endtime, confirmed)
      VALUES (${terenid}, ${userId}, ${clubid}, ${starttime}, ${endtime}, false)
      RETURNING *
    `

    // Notify club of new booking request
    await notifyClubNewBooking(terenid, userId, clubid, starttime, endtime, 'pending')

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
