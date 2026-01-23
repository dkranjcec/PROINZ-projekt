import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import sql from '@/lib/db'

// Creates first booking + Stripe subscription for recurring bookings
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { terenid, clubid, starttime, endtime, price } = await request.json()

    // Prevent booking in the past
    const bookingStart = new Date(starttime)
    const now = new Date()
    if (bookingStart < now) {
      return NextResponse.json({ error: 'Cannot create bookings in the past' }, { status: 400 })
    }

    // Get user email from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress

    // Extract day_of_week and time from starttime
    const startDate = new Date(starttime)
    const endDate = new Date(endtime)
    const dayOfWeek = startDate.getDay() === 0 ? 7 : startDate.getDay()
    const startTime = starttime.split('T')[1].substring(0, 5) // HH:MM
    const endTime = endtime.split('T')[1].substring(0, 5)

    // Check for conflicts with existing bookings - use the same logic as regular bookings
    const existingBookings = await sql`
      SELECT starttime, endtime FROM termin 
      WHERE terenid = ${terenid}
    `

    const { hasAnyOverlap } = await import('@/lib/booking-utils')
    
    // Check if the first instance of this recurring booking conflicts with existing bookings
    if (hasAnyOverlap(existingBookings as any, { starttime, endtime })) {
      return NextResponse.json({ 
        error: 'This time slot is already booked' 
      }, { status: 409 })
    }

    // Check if future instances would conflict with existing future bookings
    // Look at all future bookings on the same day of week
    const futureBookings = existingBookings.filter((booking: any) => {
      const bookingDate = new Date(booking.starttime)
      const bookingDayOfWeek = bookingDate.getDay() === 0 ? 7 : bookingDate.getDay()
      return bookingDayOfWeek === dayOfWeek && bookingDate > startDate
    })

    // For each future booking on the same day, check if times overlap
    for (const booking of futureBookings) {
      const bookingStart = new Date(booking.starttime)
      const bookingEnd = new Date(booking.endtime)
      
      // Create virtual recurring booking for comparison
      const recurringBookingDate = new Date(bookingStart)
      recurringBookingDate.setHours(parseInt(startTime.split(':')[0]))
      recurringBookingDate.setMinutes(parseInt(startTime.split(':')[1]))
      recurringBookingDate.setSeconds(0)
      
      const recurringBookingEndDate = new Date(bookingStart)
      recurringBookingEndDate.setHours(parseInt(endTime.split(':')[0]))
      recurringBookingEndDate.setMinutes(parseInt(endTime.split(':')[1]))
      recurringBookingEndDate.setSeconds(0)

      // Check if they overlap using the same logic
      if (hasAnyOverlap([booking] as any, { 
        starttime: recurringBookingDate.toISOString(), 
        endtime: recurringBookingEndDate.toISOString() 
      })) {
        return NextResponse.json({ 
          error: 'This recurring time slot conflicts with an existing future booking' 
        }, { status: 409 })
      }
    }

    // Check for conflicts with other recurring bookings (same day and overlapping time)
    const conflictingRecurring = await sql`
      SELECT * FROM recurring_booking
      WHERE terenid = ${terenid}
        AND day_of_week = ${dayOfWeek}
        AND is_active = true
    `

    for (const recurring of conflictingRecurring) {
      const recurringStart = recurring.start_time.substring(0, 5)
      const recurringEnd = recurring.end_time.substring(0, 5)
      
      if (
        (startTime >= recurringStart && startTime < recurringEnd) ||
        (endTime > recurringStart && endTime <= recurringEnd) ||
        (startTime <= recurringStart && endTime >= recurringEnd)
      ) {
        return NextResponse.json(
          { error: 'This time slot conflicts with another recurring booking' },
          { status: 409 }
        )
      }
    }

    // DON'T create booking yet - it will be created after payment in webhook
    // Get base URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

    // Get court details
    const [court] = await sql`
      SELECT t.*, c.clubname 
      FROM teren t
      JOIN club c ON t.userid = c.userid
      WHERE t.terenid = ${terenid}
    `

    if (!court) {
      return NextResponse.json({ error: 'Court not found' }, { status: 404 })
    }

    const bookingPrice = price || court.price || 0
    const platformFee = 2.00

    // Create or get Stripe customer
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    })

    let customer
    if (customers.data.length > 0) {
      customer = customers.data[0]
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          clerk_user_id: userId
        }
      })
    }

    // Create Stripe checkout with recurring option
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer: customer.id, // Use explicit customer ID
      payment_intent_data: {
        setup_future_usage: 'off_session', // Save payment method for future charges
      },
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `${court.terenname} - ${court.clubname}`,
              description: `First booking + recurring subscription`,
            },
            unit_amount: Math.round(bookingPrice * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Platform Service Fee',
            },
            unit_amount: 200,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}&terenid=${terenid}&recurring=true`,
      cancel_url: `${origin}/book-court/${terenid}`,
      metadata: {
        terenid,
        clubid,
        playerid: userId,
        starttime,
        endtime,
        makeRecurring: 'true',
        dayOfWeek: dayOfWeek.toString(),
        startTime,
        endTime,
        price: bookingPrice.toString()
      },
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Error creating recurring booking:', error)
    return NextResponse.json({ error: 'Failed to create recurring booking' }, { status: 500 })
  }
}
