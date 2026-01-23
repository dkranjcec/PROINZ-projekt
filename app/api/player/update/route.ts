import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { firstName, lastName, phoneNumber, preferredTimeStart, preferredTimeEnd, skillLevel } = await request.json()

    // Validate preferred time interval
    if (preferredTimeStart && preferredTimeEnd && preferredTimeStart >= preferredTimeEnd) {
      return NextResponse.json({ error: 'Preferred start time must be before end time' }, { status: 400 })
    }

    await sql`
      UPDATE player 
      SET firstname = ${firstName}, 
          lastname = ${lastName}, 
          phone_number = ${phoneNumber},
          preferred_time_start = ${preferredTimeStart},
          preferred_time_end = ${preferredTimeEnd},
          skill_level = ${skillLevel}
      WHERE userid = ${userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player information' }, { status: 500 })
  }
}
