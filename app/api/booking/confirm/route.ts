import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a club
    const [user] = await sql`
      SELECT role FROM users WHERE userid = ${userId}
    `

    if (!user || user.role !== 'club') {
      return NextResponse.json({ error: 'Only clubs can confirm bookings' }, { status: 403 })
    }

    const body = await request.json()
    const { terenid, playerid, starttime } = body

    if (!terenid || !playerid || !starttime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the court belongs to this club
    const [court] = await sql`
      SELECT * FROM teren WHERE terenid = ${terenid} AND userid = ${userId}
    `

    if (!court) {
      return NextResponse.json({ error: 'Court not found or unauthorized' }, { status: 404 })
    }

    // Update the booking to confirmed
    const result = await sql`
      UPDATE termin 
      SET confirmed = true
      WHERE terenid = ${terenid} 
        AND playerid = ${playerid}
        AND clubid = ${userId}
        AND starttime = ${starttime}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(result[0], { status: 200 })
  } catch (error) {
    console.error('Error confirming booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
