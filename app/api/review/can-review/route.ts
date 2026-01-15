import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const clubid = searchParams.get('clubid')

    if (!clubid) {
      return NextResponse.json({ error: 'Missing clubid' }, { status: 400 })
    }

    // Check if the player has any confirmed bookings with this club
    const bookings = await sql`
      SELECT terenid FROM termin 
      WHERE playerid = ${userId} AND clubid = ${clubid} AND confirmed = true
      LIMIT 1
    `

    const canReview = bookings.length > 0

    return NextResponse.json({ canReview }, { status: 200 })
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
