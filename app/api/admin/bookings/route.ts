import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAdmin } from '@/lib/admin-utils'

export async function GET() {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const bookings = await sql`
      SELECT 
        t.*,
        ter.terenname,
        c.clubname,
        p.firstname || ' ' || p.lastname as playername
      FROM termin t
      JOIN teren ter ON t.terenid = ter.terenid
      JOIN club c ON t.clubid = c.userid
      JOIN player p ON t.playerid = p.userid
      ORDER BY t.starttime DESC
      LIMIT 500
    `

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const { searchParams } = new URL(request.url)
    const playerid = searchParams.get('playerid')
    const terenid = searchParams.get('terenid')
    const clubid = searchParams.get('clubid')
    const starttime = searchParams.get('starttime')

    if (!playerid || !terenid || !clubid || !starttime) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Delete the booking using composite key
    await sql`
      DELETE FROM termin 
      WHERE playerid = ${playerid}
        AND terenid = ${terenid}
        AND clubid = ${clubid}
        AND starttime = ${starttime}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting booking:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
