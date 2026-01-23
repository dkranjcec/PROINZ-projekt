import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import sql from '@/lib/db'
import { validateBookingWithinWorkHours } from '@/lib/workhours-utils'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { terenid, clubid, starttime, endtime } = body

    // Get court details and price
    const [court] = await sql`
      SELECT t.*, c.clubname 
      FROM teren t
      JOIN club c ON t.userid = c.userid
      WHERE t.terenid = ${terenid}
    `

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    if (!court.price || court.price <= 0) {
      return NextResponse.json({ error: 'This court does not require payment' }, { status: 400 })
    }

    // Prevent retroactive bookings
    const bookingStart = new Date(starttime)
    const now = new Date()
    if (bookingStart < now) {
      return NextResponse.json({ error: 'Cannot create bookings in the past' }, { status: 400 })
    }

    // Calculate duration
    const start = new Date(starttime)
    const end = new Date(endtime)
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

    // Validate minimum 1-hour booking duration
    if (durationHours < 1) {
      return NextResponse.json({ error: 'Minimum booking duration is 1 hour' }, { status: 400 })
    }

    // Validate booking is within club work hours
    const workHoursValidation = await validateBookingWithinWorkHours(clubid, starttime, endtime)
    if (!workHoursValidation.valid) {
      return NextResponse.json({ error: workHoursValidation.error }, { status: 400 })
    }

    // Check for conflicts with existing bookings
    const existingBookings = await sql`
      SELECT starttime, endtime FROM termin 
      WHERE terenid = ${terenid}
    `

    const { hasAnyOverlap } = await import('@/lib/booking-utils')
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

    const bookingDayOfWeek = bookingStart.getDay() === 0 ? 7 : bookingStart.getDay()
    const bookingStartTime = starttime.split('T')[1].substring(0, 5) // HH:MM
    const bookingEndTime = endtime.split('T')[1].substring(0, 5) // HH:MM

    for (const recurring of recurringBookings) {
      if (recurring.day_of_week === bookingDayOfWeek) {
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

    // Calculate total price
    const bookingPrice = court.price * durationHours
    const platformFee = 2.00 // €2 platform fee
    const totalPrice = bookingPrice + platformFee

    // Get base URL from request origin (works for both local and production)
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${court.terenname} - ${court.clubname}`,
              description: `Court booking for ${durationHours} hour${durationHours !== 1 ? 's' : ''}`,
            },
            unit_amount: Math.round(bookingPrice * 100), // Convert to cents
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Platform Service Fee',
              description: 'Non-refundable processing fee',
            },
            unit_amount: 200, // €2 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&terenid=${terenid}`,
      cancel_url: `${origin}/book-court/${terenid}`,
      metadata: {
        terenid,
        clubid,
        playerid: userId,
        starttime,
        endtime,
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
