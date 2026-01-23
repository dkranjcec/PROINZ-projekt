import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAdmin } from '@/lib/admin-utils'

export async function GET() {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const clubs = await sql`
      SELECT c.*
      FROM club c
      ORDER BY c.clubname ASC
    `

    return NextResponse.json(clubs)
  } catch (error) {
    console.error('Error fetching clubs:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
