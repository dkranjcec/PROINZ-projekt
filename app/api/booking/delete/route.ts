import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'
// AI korišten za pomoć pri stvaranju rute za brisanje rezervacije
export async function DELETE(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { terenid, clubid, playerid, starttime } = body

    if (!terenid || !clubid || !playerid || !starttime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if the booking exists and belongs to the user
    const bookings = await sql`
      SELECT * FROM termin 
      WHERE terenid = ${terenid} 
        AND clubid = ${clubid}
        AND playerid = ${playerid}
        AND starttime = ${starttime}
    `

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 })
    }

    const booking = bookings[0]

    // Check if booking is at least 24 hours in the future
    const bookingStart = new Date(booking.starttime)
    const now = new Date()
    const hoursUntilBooking = (bookingStart.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursUntilBooking < 24) {
      return NextResponse.json({ 
        error: 'Bookings can only be cancelled at least 24 hours in advance' 
      }, { status: 400 })
    }

    // Check if this is a paid booking - should not be deleted through this endpoint
    if (booking.confirmed && booking.stripesessionid) {
      return NextResponse.json({ 
        error: 'Paid bookings must be cancelled through the dashboard to receive a refund' 
      }, { status: 400 })
    }

    // Delete the booking
    await sql`
      DELETE FROM termin 
      WHERE terenid = ${terenid} 
        AND clubid = ${clubid}
        AND playerid = ${playerid}
        AND starttime = ${starttime}
    `

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
