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
