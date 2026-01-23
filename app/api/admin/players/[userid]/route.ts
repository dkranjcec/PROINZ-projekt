import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAdmin } from '@/lib/admin-utils'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userid: string }> }
) {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const { userid: targetUserId } = await params

    // Database CASCADE will handle:
    // - player → termin (bookings), review, notification
    await sql`DELETE FROM users WHERE userid = ${targetUserId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting player:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
