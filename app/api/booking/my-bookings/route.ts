import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Get upcoming bookings (future bookings)
    const upcomingBookings = await sql`
      SELECT t.*, ter.terenname, ter.price, c.clubname
      FROM termin t
      JOIN teren ter ON t.terenid = ter.terenid
      JOIN club c ON t.clubid = c.userid
      WHERE t.playerid = ${userId} AND t.starttime >= ${now.toISOString()}
      ORDER BY t.starttime ASC
    `

    // Get past bookings
    const pastBookings = await sql`
      SELECT t.*, ter.terenname, ter.price, c.clubname
      FROM termin t
      JOIN teren ter ON t.terenid = ter.terenid
      JOIN club c ON t.clubid = c.userid
      WHERE t.playerid = ${userId} AND t.starttime < ${now.toISOString()}
      ORDER BY t.starttime DESC
      LIMIT 20
    `

    return NextResponse.json({
      upcoming: upcomingBookings,
      past: pastBookings
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
