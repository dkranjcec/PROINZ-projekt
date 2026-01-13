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
    const { terenid, clubid, starttime, endtime } = body

    const validation = validateBookingFields(body)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const existingBookings = await sql`
      SELECT starttime, endtime FROM termin 
      WHERE terenid = ${terenid}
    `

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (hasAnyOverlap(existingBookings as any, { starttime, endtime })) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 })
    }

    // Create the booking (unconfirmed by default, club needs to confirm)
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
