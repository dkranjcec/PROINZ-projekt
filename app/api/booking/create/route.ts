import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { terenid, clubid, starttime, endtime } = body

    if (!terenid || !clubid || !starttime || !endtime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if the time slot is already booked
    const existingBookings = await sql`
      SELECT * FROM termin 
      WHERE terenid = ${terenid}
      AND (
        (starttime <= ${starttime} AND endtime > ${starttime})
        OR (starttime < ${endtime} AND endtime >= ${endtime})
        OR (starttime >= ${starttime} AND endtime <= ${endtime})
      )
    `

    if (existingBookings.length > 0) {
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
