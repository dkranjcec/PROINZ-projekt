import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAdmin } from '@/lib/admin-utils'

export async function GET() {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const courts = await sql`
      SELECT t.*, c.clubname
      FROM teren t
      JOIN club c ON t.userid = c.userid
      ORDER BY c.clubname ASC, t.terenname ASC
    `

    return NextResponse.json(courts)
  } catch (error) {
    console.error('Error fetching courts:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
