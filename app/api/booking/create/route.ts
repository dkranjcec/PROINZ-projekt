import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'
import { validateBookingFields, hasAnyOverlap } from '@/lib/booking-utils'

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
    const now = new Date()
    if (bookingStart < now) {
      return NextResponse.json({ error: 'Cannot create bookings in the past' }, { status: 400 })
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

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
