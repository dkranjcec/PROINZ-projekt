import { auth } from '@clerk/nextjs/server'
import sql from '@/lib/db'
import { NextResponse } from 'next/server'

// GET existing review
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

    // Fetch existing review
    const [review] = await sql`
      SELECT rating, commentary FROM commentary 
      WHERE playerid = ${userId} AND clubid = ${clubid}
    `

    if (!review) {
      return NextResponse.json({ review: null }, { status: 200 })
    }

    return NextResponse.json({ review }, { status: 200 })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST/PUT create or update review
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clubid, rating, commentary } = body

    if (!clubid || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check if the player has a confirmed booking with this club
    const bookings = await sql`
      SELECT terenid FROM termin 
      WHERE playerid = ${userId} AND clubid = ${clubid} AND confirmed = true
      LIMIT 1
    `

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'You must have a confirmed booking with this club to leave a review' }, { status: 403 })
    }

    // Check if review already exists
    const [existingReview] = await sql`
      SELECT * FROM commentary 
      WHERE playerid = ${userId} AND clubid = ${clubid}
    `

    let result
    if (existingReview) {
      // Update existing review
      result = await sql`
        UPDATE commentary 
        SET rating = ${rating}, commentary = ${commentary || ''}
        WHERE playerid = ${userId} AND clubid = ${clubid}
        RETURNING *
      `
    } else {
      // Create new review
      result = await sql`
        INSERT INTO commentary (playerid, clubid, rating, commentary)
        VALUES (${userId}, ${clubid}, ${rating}, ${commentary || ''})
        RETURNING *
      `
    }

    return NextResponse.json({ review: result[0] }, { status: 200 })
  } catch (error) {
    console.error('Error saving review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE review
export async function DELETE(request: Request) {
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

    await sql`
      DELETE FROM commentary 
      WHERE playerid = ${userId} AND clubid = ${clubid}
    `

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
