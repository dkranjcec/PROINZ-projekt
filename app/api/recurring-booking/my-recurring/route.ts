import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recurringBookings = await sql`
      SELECT 
        rb.*,
        t.terenname,
        c.clubname,
        c.clubaddress
      FROM recurring_booking rb
      JOIN teren t ON rb.terenid = t.terenid
      JOIN club c ON rb.clubid = c.userid
      WHERE rb.playerid = ${userId}
        AND rb.is_active = true
      ORDER BY rb.day_of_week, rb.start_time
    `

    return NextResponse.json({ recurringBookings })
  } catch (error) {
    console.error('Error fetching recurring bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring bookings' }, { status: 500 })
  }
}
