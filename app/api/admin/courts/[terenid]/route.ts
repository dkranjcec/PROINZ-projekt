import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireAdmin } from '@/lib/admin-utils'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ terenid: string }> }
) {
  try {
    const { userId } = await auth()
    await requireAdmin(userId)

    const { terenid } = await params

    // Database CASCADE will handle:
    // - termin (bookings), terenphoto via teren foreign keys
    await sql`DELETE FROM teren WHERE terenid = ${terenid}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting court:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message.includes('Unauthorized') || message.includes('Forbidden') ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
